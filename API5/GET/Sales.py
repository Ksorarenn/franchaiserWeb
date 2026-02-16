from flask import Blueprint
from db import get_connection

get_sales_blueprint = Blueprint("get_sales", __name__)


@get_sales_blueprint.get("/api/v1/Sales")
def sales():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """select 
        s.SaleID,
        p.Name as ProductName,
        s.MachineID,
        s.Quantity,
        s.SaleSum,
        pay.Name as PaymentTypeName,
        s.SaleDateTime from Sales s
        left join Products p on s.ProductID=p.ProductID
        left join PaymentType pay on s.PaymentTypeID=pay.PaymentTypeID"""
        cursor.execute(query)
        sale = cursor.fetchall()
        if sale:
            sales_json = []
            for saleit in sale:
                sales_json.append({
                    "SaleID": saleit[0],
                    "ProductName": saleit[1],
                    "MachineID": saleit[2],
                    "Quantity": saleit[3],
                    "SaleSum": saleit[4],
                    "PaymentTypeName": saleit[5],
                    "SaleDateTime": saleit[6]
                })
            return sales_json
        else:
            return "Не найдены записи о продажах"
    except Exception as e:
        return "Ошибка сервера", 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
