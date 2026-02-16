from flask import Flask
from flask_cors import CORS
from GET.Users import get_users_blueprint
from GET.Sales import get_sales_blueprint
from GET.Products import get_products_blueprint
from GET.VendingMachines import get_vm_blueprint
from GET.Maintenance import get_mtc_blueprint
from POST.maintenance import post_mtc_blueprint
from POST.users import post_user_blueprint
from POST.products import post_products_blueprint
from POST.sales import post_sales_blueprint
from POST.vendingMachines import post_vm_blueprint
from POST.login import post_login_blueprint

app = Flask(__name__)
CORS(app)

app.register_blueprint(get_users_blueprint)
app.register_blueprint(get_sales_blueprint)
app.register_blueprint(get_products_blueprint)
app.register_blueprint(get_vm_blueprint)
app.register_blueprint(get_mtc_blueprint)
app.register_blueprint(post_mtc_blueprint)
app.register_blueprint(post_user_blueprint)
app.register_blueprint(post_products_blueprint)
app.register_blueprint(post_sales_blueprint)
app.register_blueprint(post_vm_blueprint)
app.register_blueprint(post_login_blueprint)

if __name__ == '__main__':
    app.run(host ='0.0.0.0', debug=True, port=8086)