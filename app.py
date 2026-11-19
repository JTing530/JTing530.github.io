#!/usr/bin/python
import flask
import time
import math
from waitress import serve

from database import DB

app = flask.Flask(__name__)

db = DB.open("wordle_db.pkl")

@app.route("/geffen-wordle", methods=["GET"])
def index():
    return "Please put the word for the wordle after the slash. Example: https://sanghai.org/geffen-wordle/example"

@app.route("/geffen-wordle/<word>", methods=["GET"])
def wordle(word):
    word = word.lower()
    if word not in db.word_to_uuids.keys():
        db.word_to_uuids[word] = []
        db.save()
    
    return flask.render_template("wordle.html", word=word, word_length=len(word), num_attempts=6)

@app.route("/geffen-wordle/generate-uuid", methods=["GET"])
def generate_uuid():
    return db.create_uuid()

@app.route("/geffen-wordle/get-rank", methods=["POST"])
def get_rank():
    data = flask.request.get_json()
    uuid = data["uuid"]
    word = data["word"]
    past_tense = False

    return _get_rank(uuid, word, past_tense)

def _get_rank(uuid, word, past_tense=True):
    if word in db.word_to_uuids.keys():
        # Determine ranking
        scores = db.word_to_uuid_to_score[word]
        sorted_scores = sorted(scores.items(), key=lambda x: x[1])
        ranking = sorted_scores.index((uuid, scores[uuid])) + 1
        suffix = "th"
        if ranking == 1:
            suffix = "st"
        elif ranking == 2:
            suffix = "nd"
        elif ranking == 3:
            suffix = "rd"

        if past_tense:
            out_str = f"You ranked {ranking}{suffix}!"
        else:
            out_str = f"Your ranking is #{ranking}."
    else:
        out_str = ""

    return out_str

@app.route("/geffen-wordle/submit-result", methods=["POST"])
def submit_result():
    data = flask.request.get_json()
    word = data["word"]
    uuid = data["uuid"]
    
    rows = data["rows"]
    board = [row for row in rows.values()]

    try:
        attempts_taken = board.index(word) + 1
    except ValueError:
        attempts_taken = 6

    submit_time = time.time()

    submit_time_differientator = submit_time / math.pow(10, math.ceil(math.log10(submit_time)))
    
    out_str = ""

    if word in db.word_to_uuids.keys():
        db.word_to_uuids[word].append(uuid)
        db.word_to_uuid_to_score[word][uuid] = (attempts_taken * submit_time) + submit_time_differientator
        db.save()

        out_str = _get_rank(uuid, word)
    else:
        return out_str, 400

    return out_str, 200

@app.route("/geffen-wordle/uuid-eligible", methods=["POST"])
def uuid_eligible():
    data = flask.request.get_json()
    word = data["word"]
    uuid = data["uuid"]

    if word in db.word_to_uuids.keys():
        if uuid in db.word_to_uuids[word]:
            return {"eligible": False}
        else:
            return {"eligible": True}
    
    return {"eligible": False}

if __name__ == "__main__":
    serve(app, host="0.0.0.0", port=5005)