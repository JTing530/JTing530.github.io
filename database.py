import pickle
import os
import uuid
from collections import defaultdict

class DB:
    def __init__(self, path):
        self.word_to_uuids = {}
        self.uuids = set()
        self.word_to_uuid_to_score = defaultdict(dict)

        self.path = path
        
    @staticmethod
    def open(path):
        if os.path.exists(path):
            with open(path, "rb") as f:
                return pickle.load(f)
        else:
            return DB(path)
    
    def save(self):
        with open(self.path, "wb") as f:
            pickle.dump(self, f)

    def create_uuid(self):
        new_uuid = str(uuid.uuid4())
        while new_uuid in self.uuids:
            new_uuid = uuid.uuid4()
        self.uuids.add(new_uuid)
        self.save()
        
        return new_uuid