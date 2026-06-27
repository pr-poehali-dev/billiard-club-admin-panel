import json
import os
import base64
import uuid
import hashlib
import psycopg2
import boto3


def handler(event: dict, context) -> dict:
    '''Управление настройками клуба, столами, авторизацией и статистикой'''
    method = event.get('httpMethod', 'GET')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    def ok(data):
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps(data, ensure_ascii=False)}

    def err(msg, code=400):
        return {'statusCode': code, 'headers': cors, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()

    def esc(v):
        return str(v).replace("'", "''")

    qp = event.get('queryStringParameters') or {}
    body = json.loads(event.get('body') or '{}') if method != 'GET' else {}
    resource = qp.get('resource') or body.get('resource', 'settings')

    # ── AUTH ─────────────────────────────────────────────────────────────────
    if resource == 'login':
        username = body.get('username', '').strip()
        password = body.get('password', '')
        if not username or not password:
            cur.close(); conn.close()
            return err('Введите логин и пароль')
        cur.execute(f"SELECT id, password_hash FROM admin_users WHERE username = '{esc(username)}'")
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return err('Неверный логин или пароль', 401)
        stored = row[1]
        pw_hash = hashlib.sha256(password.encode()).hexdigest()
        valid = (stored == password) or (stored == pw_hash) or (stored == f'sha256:{pw_hash}')
        if not valid:
            return err('Неверный логин или пароль', 401)
        return ok({'success': True, 'username': username})

    # ── TABLES GET ───────────────────────────────────────────────────────────
    if resource == 'tables':
        cur.execute(
            "SELECT id, name, table_type, size_ft, price_per_hour, sort_order, model, description, controller_id, "
            "hall_x, hall_y, hall_rotation "
            "FROM billiard_tables ORDER BY sort_order, id"
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        return ok([{
            'id': r[0], 'name': r[1], 'table_type': r[2], 'size_ft': r[3],
            'price_per_hour': r[4], 'sort_order': r[5],
            'model': r[6], 'description': r[7], 'controller_id': r[8],
            'hall_x': r[9], 'hall_y': r[10], 'hall_rotation': r[11] or 0,
        } for r in rows])

    # ── HALL MAP GET ─────────────────────────────────────────────────────────
    if resource == 'hall_map':
        cur.execute(
            "SELECT id, name, table_type, size_ft, price_per_hour, hall_x, hall_y, hall_rotation "
            "FROM billiard_tables ORDER BY sort_order, id"
        )
        rows = cur.fetchall()
        cur.execute("SELECT hall_map_bg FROM club_settings WHERE id = 1")
        bg_row = cur.fetchone()
        cur.close(); conn.close()
        return ok({
            'tables': [{
                'id': r[0], 'name': r[1], 'table_type': r[2], 'size_ft': r[3],
                'price_per_hour': r[4], 'hall_x': r[5], 'hall_y': r[6], 'hall_rotation': r[7] or 0,
            } for r in rows],
            'bg': bg_row[0] if bg_row else None,
        })

    # ── BALANCE GET — выручка онлайн-платежей за сегодня ─────────────────────
    if resource == 'balance':
        cur.execute(
            "SELECT COALESCE(SUM(bt.price_per_hour), 0) "
            "FROM bookings b "
            "LEFT JOIN billiard_tables bt ON bt.id = b.table_id "
            "WHERE b.payment_place = 'Онлайн' "
            "AND b.booking_date = CURRENT_DATE"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        return ok({'balance': float(row[0]) if row else 0})

    # ── STATS GET ────────────────────────────────────────────────────────────
    if resource == 'stats':
        date_from = qp.get('from', '')
        date_to = qp.get('to', '')
        where = ''
        if date_from and date_to:
            where = f"WHERE booking_date >= '{esc(date_from)}' AND booking_date <= '{esc(date_to)}'"
        elif date_from:
            where = f"WHERE booking_date >= '{esc(date_from)}'"
        cur.execute(
            f"SELECT b.id, b.table_name, to_char(b.booking_date,'YYYY-MM-DD'), b.time_slot, "
            f"b.client_name, b.status, b.payment_place, bt.price_per_hour "
            f"FROM bookings b LEFT JOIN billiard_tables bt ON bt.id = b.table_id "
            f"{where} ORDER BY b.booking_date DESC, b.time_slot DESC LIMIT 200"
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        items = [{
            'id': r[0], 'table_name': r[1], 'date': r[2], 'time_slot': r[3],
            'client_name': r[4], 'status': r[5], 'payment_place': r[6],
            'price_per_hour': r[7] or 0,
        } for r in rows]
        return ok(items)

    # ── CLUB SETTINGS GET ────────────────────────────────────────────────────
    if method == 'GET':
        cur.execute(
            "SELECT name, description, address, phone, email, website, work_hours, "
            "telegram, instagram, vk, max_messenger, photos, balance FROM club_settings WHERE id = 1"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return ok({})
        return ok({
            'name': row[0], 'description': row[1], 'address': row[2], 'phone': row[3],
            'email': row[4], 'website': row[5], 'work_hours': row[6],
            'telegram': row[7], 'instagram': row[8], 'vk': row[9], 'max_messenger': row[10],
            'photos': row[11] if row[11] else [],
            'balance': float(row[12]) if row[12] else 0,
        })

    action = body.get('action', 'save')

    # ── TABLE CRUD ───────────────────────────────────────────────────────────
    if action == 'delete_table':
        tid = int(body.get('id', 0))
        cur.execute(f"DELETE FROM billiard_tables WHERE id = {tid}")
        cur.close(); conn.close()
        return ok({'success': True})

    if action == 'update_table':
        tid = int(body.get('id', 0))
        name = esc(body.get('name', ''))
        table_type = esc(body.get('table_type', ''))
        size_ft = int(body.get('size_ft', 12))
        price = int(body.get('price_per_hour', 700))
        model = esc(body.get('model', ''))
        description = esc(body.get('description', ''))
        controller_id = esc(body.get('controller_id', ''))
        cur.execute(
            f"UPDATE billiard_tables SET name='{name}', table_type='{table_type}', "
            f"size_ft={size_ft}, price_per_hour={price}, model='{model}', "
            f"description='{description}', controller_id='{controller_id}' WHERE id={tid}"
        )
        cur.close(); conn.close()
        return ok({'success': True})

    if action == 'add_table':
        name = esc(body.get('name', 'Новый стол'))
        table_type = esc(body.get('table_type', 'Русская пирамида'))
        size_ft = int(body.get('size_ft', 12))
        price = int(body.get('price_per_hour', 700))
        model = esc(body.get('model', ''))
        description = esc(body.get('description', ''))
        controller_id = esc(body.get('controller_id', ''))
        cur.execute(
            f"INSERT INTO billiard_tables (name, table_type, size_ft, price_per_hour, model, description, controller_id, sort_order) "
            f"VALUES ('{name}', '{table_type}', {size_ft}, {price}, '{model}', '{description}', '{controller_id}', "
            f"(SELECT COALESCE(MAX(sort_order),0)+1 FROM billiard_tables)) "
            f"RETURNING id, name, table_type, size_ft, price_per_hour, sort_order, model, description, controller_id"
        )
        r = cur.fetchone()
        cur.close(); conn.close()
        return ok({
            'id': r[0], 'name': r[1], 'table_type': r[2], 'size_ft': r[3],
            'price_per_hour': r[4], 'sort_order': r[5],
            'model': r[6], 'description': r[7], 'controller_id': r[8], 'success': True,
        })

    # ── HALL MAP BG UPLOAD ───────────────────────────────────────────────────
    if action == 'upload_hall_bg':
        file_b64 = body.get('file', '')
        content_type = body.get('contentType', 'image/png')
        ext = content_type.split('/')[-1].replace('jpeg', 'jpg')
        file_bytes = base64.b64decode(file_b64.split(',')[-1])
        key = f"hall-map/bg_{uuid.uuid4().hex}.{ext}"
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        s3.put_object(Bucket='files', Key=key, Body=file_bytes, ContentType=content_type)
        url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        cur.execute(f"UPDATE club_settings SET hall_map_bg = '{esc(url)}' WHERE id = 1")
        cur.close(); conn.close()
        return ok({'url': url})

    # ── HALL MAP BG CLEAR ────────────────────────────────────────────────────
    if action == 'clear_hall_bg':
        cur.execute("UPDATE club_settings SET hall_map_bg = NULL WHERE id = 1")
        cur.close(); conn.close()
        return ok({'success': True})

    # ── HALL MAP SAVE ────────────────────────────────────────────────────────
    if action == 'save_hall_map':
        positions = body.get('positions', [])
        for p in positions:
            tid = int(p.get('id', 0))
            x = float(p.get('x', 0))
            y = float(p.get('y', 0))
            rot = int(p.get('rotation', 0))
            cur.execute(
                f"UPDATE billiard_tables SET hall_x={x}, hall_y={y}, hall_rotation={rot} WHERE id={tid}"
            )
        cur.close(); conn.close()
        return ok({'success': True})

    # ── PHOTO UPLOAD ─────────────────────────────────────────────────────────
    if action == 'upload_photo':
        file_b64 = body.get('file', '')
        content_type = body.get('contentType', 'image/jpeg')
        ext = content_type.split('/')[-1].replace('jpeg', 'jpg')
        file_bytes = base64.b64decode(file_b64.split(',')[-1])
        key = f"club-photos/{uuid.uuid4().hex}.{ext}"
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        s3.put_object(Bucket='files', Key=key, Body=file_bytes, ContentType=content_type)
        url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        cur.close(); conn.close()
        return ok({'url': url})

    # ── CLUB SETTINGS SAVE ───────────────────────────────────────────────────
    fields = {
        'name': body.get('name', ''),
        'description': body.get('description', ''),
        'address': body.get('address', ''),
        'phone': body.get('phone', ''),
        'email': body.get('email', ''),
        'website': body.get('website', ''),
        'work_hours': body.get('work_hours', ''),
        'telegram': body.get('telegram', ''),
        'instagram': body.get('instagram', ''),
        'vk': body.get('vk', ''),
        'max_messenger': body.get('max_messenger', ''),
    }
    photos = json.dumps(body.get('photos', []), ensure_ascii=False)
    set_parts = ", ".join([f"{k} = '{esc(v)}'" for k, v in fields.items()])
    cur.execute(
        f"UPDATE club_settings SET {set_parts}, photos = '{esc(photos)}'::jsonb, "
        f"updated_at = NOW() WHERE id = 1"
    )
    cur.close(); conn.close()
    return ok({'success': True})