from flask import Blueprint, request, jsonify
from datetime import datetime
from db import get_connection
import pandas as pd
import io

post_vm_blueprint = Blueprint("post_vm", __name__)

@post_vm_blueprint.post("/api/v1/VendingMachines")
def add_vending_machine():
    conn = None
    cursor = None
    
    try:
        if 'file' in request.files:
            return process_csv(request.files['file'])
        else:
            return process_json(request.get_json())
            
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def process_json(data):
    if not data:
        return jsonify({"error": "Неверный формат JSON"}), 400
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Проверка уникальности
    cursor.execute("SELECT COUNT(*) FROM VendingMachines WHERE SerialNumber = ? OR InventoryNumber = ?",
                  (data.get('SerialNumber', ''), data.get('InventoryNumber', '')))
    
    if cursor.fetchone()[0] > 0:
        return jsonify({"error": "Дублирование SerialNumber или InventoryNumber"}), 400
    
    # Подготовка параметров
    params = (
        str(data.get('Location', '')),
        str(data.get('Model', '')),
        int(data['PaymentTypeID']),
        float(data.get('FullIncome', 0.0)),
        str(data.get('SerialNumber', '')),
        str(data.get('InventoryNumber', '')),
        str(data.get('Manufacturer', '')),
        str(data.get('ManufactureDate', '')),
        str(data.get('DateOfCommissioning', '')),
        str(data.get('LastVerificationDate', '')),
        int(data.get('VerificationInterval', 6)),
        int(data.get('ResourceHours', 0)),
        data.get('DateOfNextFixing', ''),
        int(data.get('MaintenanceTimeHours', 4)),
        int(data['MachineStatusID']),
        int(data['CountryID']),
        str(data.get('InventoryDate', datetime.now().date())),
        int(data['LastCheckedByUserID'])
    )
    
    cursor.execute("""
        INSERT INTO VendingMachines (Location, Model, PaymentTypeID, FullIncome, SerialNumber, 
                    InventoryNumber, Manufacturer, ManufactureDate, DateOfCommissioning, 
                    LastVerificationDate, VerificationInterval, ResourceHours, 
                    DateOfNextFixing, MaintenanceTimeHours, MachineStatusID, 
                    CountryID, InventoryDate, LastCheckedByUserID) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, params)
    
    conn.commit()
    return jsonify({"message": "Запись успешно создана"}), 201

def process_csv(file):
    if not file.filename.endswith('.csv'):
        return jsonify({"error": "Только CSV файлы"}), 400
    
    df = pd.read_csv(io.StringIO(file.read().decode('utf-8')))
    
    required = ['Location', 'Model', 'PaymentTypeID', 'SerialNumber', 
                'InventoryNumber', 'Manufacturer', 'ManufactureDate',
                'DateOfCommissioning', 'LastVerificationDate', 
                'ResourceHours', 'MachineStatusID', 'CountryID']
    
    if any(field not in df.columns for field in required):
        return jsonify({"error": "Отсутствуют обязательные поля"}), 400
    
    conn = get_connection()
    cursor = conn.cursor()
    
    errors = []
    success = 0
    
    for idx, row in df.iterrows():
        try:
            # Проверка уникальности
            cursor.execute("SELECT COUNT(*) FROM VendingMachines WHERE SerialNumber = ? OR InventoryNumber = ?",
                          (str(row['SerialNumber']), str(row['InventoryNumber'])))
            
            if cursor.fetchone()[0] > 0:
                errors.append(f"Строка {idx+2}: Дублирование")
                continue
            
            # Вставка
            cursor.execute("""
                INSERT INTO VendingMachines (Location, Model, PaymentTypeID, FullIncome, SerialNumber, 
                            InventoryNumber, Manufacturer, ManufactureDate, DateOfCommissioning, 
                            LastVerificationDate, VerificationInterval, ResourceHours, 
                            DateOfNextFixing, MaintenanceTimeHours, MachineStatusID, 
                            CountryID, InventoryDate, LastCheckedByUserID) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                str(row['Location']), str(row['Model']), int(row['PaymentTypeID']),
                float(row.get('FullIncome', 0.0)), str(row['SerialNumber']),
                str(row['InventoryNumber']), str(row['Manufacturer']),
                str(row['ManufactureDate']), str(row['DateOfCommissioning']),
                str(row['LastVerificationDate']), int(row.get('VerificationInterval', 6)),
                int(row['ResourceHours']), str(row.get('DateOfNextFixing', '')),
                int(row.get('MaintenanceTimeHours', 4)), int(row['MachineStatusID']),
                int(row['CountryID']), str(row.get('InventoryDate', datetime.now().date())),
                int(row.get('LastCheckedByUserID', 1))
            ))
            
            success += 1
        except Exception as e:
            errors.append(f"Строка {idx+2}: {str(e)}")
    
    conn.commit()
    
    if errors:
        return jsonify({
            "success": False,
            "message": f"Загружено {success} записей, ошибок: {len(errors)}",
            "processed": success,
            "errors": errors[:5]
        }), 207
    
    return jsonify({
        "success": True,
        "message": f"Загружено {success} записей",
        "processed": success
    }), 201