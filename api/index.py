from flask import Flask, request, jsonify
import paramiko
from flask_cors import CORS


app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes and origins


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
    except Exception as e:
        return jsonify({"status": "error", "message": e}) 
        

@app.route('/query/<content>', methods=['GET'])
def query(content):
    #### PLACEHOLDER FOR QUERYING DATABASE ####
    try :
        return jsonify({"status": "success", "message": "Query successful", "content": content})
    except Exception as e:
        return jsonify({"status": "error", "message": e}) 
        

@app.route('/topic/<content>', methods=['GET'])
def topic(content):
    #### PLACEHOLDER FOR TOPIC MODELING ####
    try :
        return jsonify({"status": "success", "message": "Topic modeling successful", "content": content})
    except Exception as e:
        return jsonify({"status": "error", "message": e})
    
@app.route('/ngram/<content>', methods=['GET'])
def ngram(content):
    #### PLACEHOLDER FOR VISUALIZATION ####
    try :
        return jsonify({"status": "success", "message": "Visualization successful", "content": content})
    except Exception as e:
        return jsonify({"status": "error", "message": e})
    