'''
Business: Общий чат для всех пользователей - получение и отправка сообщений
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с request_id
Returns: HTTP response со списком сообщений общего чата или результатом отправки
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
        limit = int(params.get('limit', '100'))
        
        cur.execute("""
            SELECT m.id, m.message, m.created_at, u.full_name, u.username, u.role
            FROM chat_messages m
            JOIN users u ON m.user_id = u.id
            ORDER BY m.created_at DESC
            LIMIT %s
        """, (limit,))
        rows = cur.fetchall()
        
        messages = []
        for row in rows:
            messages.append({
                'id': row[0],
                'message': row[1],
                'createdAt': str(row[2]),
                'authorName': row[3],
                'authorUsername': row[4],
                'authorRole': row[5]
            })
        
        messages.reverse()
        
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
        user_id = body_data.get('userId')
        message = body_data.get('message', '').strip()
        
        if not message:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Message cannot be empty'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            """INSERT INTO chat_messages (user_id, message) 
               VALUES (%s, %s) RETURNING id, created_at""",
            (user_id, message)
        )
        result = cur.fetchone()
        message_id = result[0]
        created_at = result[1]
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'id': message_id, 'createdAt': str(created_at), 'message': 'Message sent'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }