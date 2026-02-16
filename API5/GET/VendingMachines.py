from flask import Blueprint, jsonify
from db import get_connection

get_vm_blueprint = Blueprint("get_vm", __name__)


@get_vm_blueprint.get("/api/v1/VendingMachines")
def vm_create():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """select 
                vm.Location,
                vm.Model,
                pay.Name as PaymentName,
                vm.FullIncome,
                vm.SerialNumber,
                vm.InventoryNumber,
                vm.Manufacturer,
                vm.ManufactureDate,
                vm.DateOfCommissioning,
                vm.LastVerificationDate,
                vm.VerificationInterval,
                vm.ResourceHours,
                vm.DateOfNextFixing,
                vm.MaintenanceTimeHours,
                ms.Name as StatusName,
                c.Name as CountryName,
                vm.InventoryDate,
                us.FullName as LastCheckedByUserName
                from VendingMachines vm
                left join PaymentType pay on vm.PaymentTypeID=pay.PaymentTypeID
                left join MachineStatus ms on vm.MachineStatusID=ms.StatusID
                left join Country c on vm.CountryID=c.CountryID
                left join Users us on vm.LastCheckedByUserID=us.UserID"""
        cursor.execute(query)
        vm = cursor.fetchall()

        if vm:
            vm_json = []
            for vmit in vm:
                vm_json.append({
                    "Location": vmit[0],
                    "Model": vmit[1],
                    "PaymentType": vmit[2],
                    "FullIncome": vmit[3],
                    "SerialNumber": vmit[4],
                    "InventoryNumber": vmit[5],
                    "Manufacturer": vmit[6],
                    "ManufactureDate": vmit[7],
                    "DateOfCommissioning": vmit[8],
                    "LastVerificationDate": vmit[9],
                    "VerificationInterval": vmit[10],
                    "ResourceHours": vmit[11],
                    "DateOfNextFixing": vmit[12],
                    "MaintenanceTimeHours": vmit[13],
                    "StatusName": vmit[14],
                    "CountryName": vmit[15],
                    "InventoryDate": vmit[16],
                    "LastCheckedByUser": vmit[17]
                })
            return jsonify(vm_json)
        else:
            return "Не найдены записи об аппаратах", 404

    except Exception as e:
        return e, 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
