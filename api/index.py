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
        

@app.route('/query/<country>/<format>/<start>/<end>/<keywords>/', methods=['GET'])
def query(country, format, start, end, keywords):
    #### PLACEHOLDER FOR QUERYING DATABASE ####
    try :
        return jsonify({"status": "success", "message": "Query successful", "content": {
            "country": country,
            "format": format,
            "start": start,
            "end": end,
            "keywords": keywords
        }})
    except Exception as e:
        return jsonify({"status": "error", "message": e}) 
        

@app.route('/topic/<embedding>/<dimred>/<clustering>/<vectorizer>/', methods=['GET'])
def topic(embedding, dimred, clustering, vectorizer, ):
    #### PLACEHOLDER FOR TOPIC MODELING ####
    try :
        return jsonify({"status": "success", "message": "Topic modeling successful", "content": {
            "embedding": embedding,
            "dimred": dimred,
            "clustering": clustering,
            "vectorizer": vectorizer,
        }})
    except Exception as e:
        return jsonify({"status": "error", "message": e})
    
@app.route('/ngram/<country>/<start>/<end>/<keywords>/', methods=['GET'])
def ngram(country, start, end, keywords):
    #### PLACEHOLDER FOR VISUALIZATION ####
    try :
        return jsonify({"status": "success", "message": "Visualization successful", "content": {
            "country": country,
            "start": start,
            "end": end,
            "keywords": keywords
        }})
    except Exception as e:
        return jsonify({"status": "error", "message": e})
    