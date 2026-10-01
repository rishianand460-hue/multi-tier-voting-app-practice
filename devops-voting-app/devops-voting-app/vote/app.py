from flask import Flask, render_template, request, make_response, jsonify
import redis
import json
import os
import uuid

app = Flask(__name__)

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

def get_redis():
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

@app.route("/", methods=["GET", "POST"])
def index():
    voter_id = request.cookies.get("voter_id")
    if not voter_id:
        voter_id = str(uuid.uuid4())

    vote = None
    if request.method == "POST":
        vote = request.form.get("vote")
        if vote in ["enjoying", "not_enjoying"]:
            data = json.dumps({"voter_id": voter_id, "vote": vote})
            try:
                r = get_redis()
                r.rpush("votes", data)
            except Exception as e:
                print(f"Redis error: {e}")

    resp = make_response(render_template("index.html", vote=vote))
    resp.set_cookie("voter_id", voter_id, max_age=31536000)
    return resp

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
