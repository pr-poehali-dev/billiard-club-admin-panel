import json
import os
import base64
import uuid
import hashlib
import psycopg2
import boto3


def handler(event: dict, context) -> dict:
    '''Управление настройками клуба, столами и авторизацией'''
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

    body = json.loads(event.get('body') or '{}') if method != 'GET' else {}
    resource = body.get('resource', 'settings')

    # ── AUTH ────────────────────────────────────────────────────────────────
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
    if method == 'GET' or resource == 'tables':
        qp = event.get('queryStringParameters') or {}
        if qp.get('resource') == 'tables' or resource == 'tables':
            cur.execute(
                "SELECT id, name, table_type, size_ft, price_per_hour, sort_order "
                "FROM billiard_tables ORDER BY sort_order, id"
            )
            rows = cur.fetchall()
            cur.close(); conn.close()
            return ok([{'id': r[0], 'name': r[1], 'table_type': r[2], 'size_ft': r[3], 'price_per_hour': r[4], 'sort_order': r[5]} for r in rows])

        # ── CLUB SETTINGS GET ────────────────────────────────────────────────
        cur.execute(
            "SELECT name, description, address, phone, email, website, work_hours, "
            "telegram, instagram, vk, max_messenger, photos FROM club_settings WHERE id = 1"
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
        cur.execute(
            f"UPDATE billiard_tables SET name='{name}', table_type='{table_type}', "
            f"size_ft={size_ft}, price_per_hour={price} WHERE id={tid}"
        )
        cur.close(); conn.close()
        return ok({'success': True})

    if action == 'add_table':
        name = esc(body.get('name', 'Новый стол'))
        table_type = esc(body.get('table_type', 'Русская пирамида'))
        size_ft = int(body.get('size_ft', 12))
        price = int(body.get('price_per_hour', 700))
        cur.execute(
            f"INSERT INTO billiard_tables (name, table_type, size_ft, price_per_hour, sort_order) "
            f"VALUES ('{name}', '{table_type}', {size_ft}, {price}, "
            f"(SELECT COALESCE(MAX(sort_order),0)+1 FROM billiard_tables)) RETURNING id, name, table_type, size_ft, price_per_hour, sort_order"
        )
        r = cur.fetchone()
        cur.close(); conn.close()
        return ok({'id': r[0], 'name': r[1], 'table_type': r[2], 'size_ft': r[3], 'price_per_hour': r[4], 'sort_order': r[5], 'success': True})

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
