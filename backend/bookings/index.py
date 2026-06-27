import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    '''Управление бронированиями столов: получение списка, создание брони с местом оплаты'''
    method = event.get('httpMethod', 'GET')

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()

    def esc(v):
        return str(v).replace("'", "''")

    if method == 'GET':
        cur.execute(
            "SELECT id, table_id, table_name, to_char(booking_date, 'YYYY-MM-DD'), "
            "time_slot, client_name, status, payment_place FROM bookings "
            "ORDER BY booking_date DESC, time_slot DESC LIMIT 50"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        items = [{
            'id': r[0], 'table_id': r[1], 'table_name': r[2], 'date': r[3],
            'time_slot': r[4], 'client_name': r[5], 'status': r[6], 'payment_place': r[7],
        } for r in rows]
        return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps(items, ensure_ascii=False)}

    body = json.loads(event.get('body') or '{}')

    if method == 'DELETE' or body.get('action') == 'delete':
        bid = int(body.get('id', 0))
        cur.execute(f"DELETE FROM bookings WHERE id = {bid}")
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'success': True})}

    table_id = int(body.get('table_id', 0))
    table_name = esc(body.get('table_name', ''))
    date = esc(body.get('date', ''))
    time_slot = esc(body.get('time_slot', ''))
    client_name = esc(body.get('client_name', 'Гость'))
    status = esc(body.get('status', 'Подтверждено'))
    payment_place = esc(body.get('payment_place', 'В клубе'))

    cur.execute(
        f"INSERT INTO bookings (table_id, table_name, booking_date, time_slot, client_name, status, payment_place) "
        f"VALUES ({table_id}, '{table_name}', '{date}', '{time_slot}', '{client_name}', '{status}', '{payment_place}') "
        f"RETURNING id"
    )
    new_id = cur.fetchone()[0]
    cur.close()
    conn.close()
    return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({'id': new_id, 'success': True})}
