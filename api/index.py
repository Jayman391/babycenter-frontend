from flask import Flask, request, jsonify
import paramiko


app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"


@app.route("/auth/<username>/<password>", methods=['GET'])
def auth(username, password):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try :
        ssh.connect('vacc-user1.uvm.edu', username=username, password=password)
        return jsonify({"status": "success", "message": "Authentication successful"})
    except paramiko.AuthenticationException:
        return jsonify({"status": "error", "message": "Authentication failed"})
        