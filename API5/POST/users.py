from flask import Blueprint, request, jsonify
from db import get_connection

post_user_blueprint = Blueprint("post_user", __name__)


@post_user_blueprint.post("/api/v1/Users")
def add_user():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Нет данных в запросе"}), 400


        conn = get_connection()
        cursor = conn.cursor()

        query = """INSERT INTO Users 
                   (FullName, Contacts, Role) 
                   VALUES (?, ?, ?)"""

        params = (
            str(data['FullName']),
            str(data['Contacts']),
            str(data['Role'])
        )

        cursor.execute(query, params)
        conn.commit()

        return jsonify({
            "message": "Запись пользователя успешно создана"
        }), 201

    except Exception as e:
        print(f"Ошибка при добавлении пользователя: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": f"Внутренняя ошибка сервера: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()