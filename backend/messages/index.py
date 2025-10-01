'''
Business: Управление сообщениями в заявках - получение и отправка
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с request_id
Returns: HTTP response со списком сообщений или результатом отправки
'''
import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    if method == 'GET':
        params = event.get('queryStringParameters', {}) or {}
        request_id = params.get('requestId')
        
        if not request_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'requestId required'}),
                'isBase64Encoded': False
            }
        
        cur.execute("""
            SELECT m.id, m.message, m.is_admin_reply, m.created_at, u.full_name, u.username
            FROM request_messages m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.request_id = %s
            ORDER BY m.created_at ASC
        """, (request_id,))
        rows = cur.fetchall()
        
        messages = []
        for row in rows:
            messages.append({
                'id': row[0],
                'message': row[1],
                'isAdminReply': row[2],
                'createdAt': str(row[3]),
                'authorName': row[4],
                'authorUsername': row[5]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'messages': messages}),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        request_id = body_data.get('requestId')
        user_id = body_data.get('userId')
        message = body_data.get('message')
        is_admin_reply = body_data.get('isAdminReply', False)
        
        cur.execute(
            """INSERT INTO request_messages (request_id, user_id, message, is_admin_reply) 
               VALUES (%s, %s, %s, %s) RETURNING id""",
            (request_id, user_id, message, is_admin_reply)
        )
        message_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'id': message_id, 'message': 'Message sent'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
