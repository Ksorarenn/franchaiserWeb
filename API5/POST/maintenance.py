from flask import Blueprint, request, jsonify
from db import get_connection

post_mtc_blueprint = Blueprint("post_mtc", __name__)


@post_mtc_blueprint.post("/api/v1/Maintenance")
def add_mtc():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Нет данных в запросе"}), 400
        conn = get_connection()
        cursor = conn.cursor()

        query = """INSERT INTO Maintenance 
                   (MachineID, MaintenanceDate, Description, Problems, DoneByUserID) 
                   VALUES (?, ?, ?, ?, ?)"""

        params = (
            int(data['MachineID']),
            str(data['MaintenanceDate']),
            str(data['Description']),
            str(data.get('Problems', '')),
            int(data['DoneByUserID'])
        )

        cursor.execute(query, params)
        conn.commit()

        cursor.execute("SELECT SCOPE_IDENTITY()")
        note_id = cursor.fetchone()[0]

        return jsonify({
            "message": "Запись технического обслуживания успешно создана"
        }), 201

    except ValueError as e:
        print(f"Ошибка преобразования типов: {e}")
        return jsonify({"error": "Ошибка в типах данных. Проверьте числовые поля"}), 400
    except Exception as e:
        print(f"Ошибка при добавлении записи ТО: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": f"Внутренняя ошибка сервера: {str(e)}"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()