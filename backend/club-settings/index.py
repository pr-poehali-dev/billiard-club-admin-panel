import json
import os
import base64
import uuid
import psycopg2
import boto3


def handler(event: dict, context) -> dict:
    '''Управление настройками бильярдного клуба: получение, сохранение, загрузка фото'''
    method = event.get('httpMethod', 'GET')

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()

    if method == 'GET':
        cur.execute(
            "SELECT name, description, address, phone, email, website, work_hours, "
            "telegram, instagram, vk, max_messenger, photos FROM club_settings WHERE id = 1"
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({})}
        data = {
            'name': row[0], 'description': row[1], 'address': row[2], 'phone': row[3],
            'email': row[4], 'website': row[5], 'work_hours': row[6],
            'telegram': row[7], 'instagram': row[8], 'vk': row[9], 'max_messenger': row[10],
            'photos': row[11] if row[11] else [],
        }
        return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps(data, ensure_ascii=False)}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', 'save')

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
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'url': url})}

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

    def esc(v):
        return str(v).replace("'", "''")

    set_parts = ", ".join([f"{k} = '{esc(v)}'" for k, v in fields.items()])
    cur.execute(
        f"UPDATE club_settings SET {set_parts}, photos = '{esc(photos)}'::jsonb, "
        f"updated_at = NOW() WHERE id = 1"
    )
    cur.close()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'success': True})}
