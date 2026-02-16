from flask import Blueprint, request, jsonify
from db import get_connection

post_login_blueprint = Blueprint("post_login", __name__)

@post_login_blueprint.post("/api/v1/login")
def login():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Нет данных"}), 400

        contacts = data.get('contacts')
        password = data.get('password')

        if not contacts or not password:
            return jsonify({"error": "Не указаны контакты или пароль"}), 400

        conn = get_connection()
        cursor = conn.cursor()
        query = "SELECT UserID, FullName, Role FROM Users WHERE Contacts = ? AND Password = ?"
        cursor.execute(query, (contacts, password))
        user = cursor.fetchone()

        if user:
            return jsonify({
                "UserID": user[0],
                "FullName": user[1],
                "Role": user[2]
            }), 200
        else:
            return jsonify({"error": "Неверные контакты или пароль"}), 401

    except Exception as e:
        print(f"Ошибка при логине: {e}")
        return jsonify({"error": "Внутренняя ошибка сервера"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()