from flask import Blueprint
from db import get_connection

get_mtc_blueprint = Blueprint("get_mtc", __name__)
@get_mtc_blueprint.get("/api/v1/Maintenance")
def mtc():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """select 
        m.NoteID,
        m.MachineID,
        m.MaintenanceDate,
        m.Description,
        m.Problems,
        us.FullName from Maintenance m
        left join Users us on m.DoneByUserID=us.UserID"""
        cursor.execute(query)
        mtc = cursor.fetchall()
        if mtc:
            mtc_json = []
            for mtcit in mtc:
                 mtc_json.append({
                     "NoteID": mtcit[0],
                     "MachineID": mtcit[1],
                     "MaintenanceDate": mtcit[2],
                     "Description": mtcit[3],
                     "Problems": mtcit[4],
                     "DoneByUser": mtcit[5]
                 })
            return mtc_json
        else:
            return "Не найдены данные об обслуживании"

    except Exception as e:
        return "Ошибка сервера", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
