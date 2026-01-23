from pydantic import BaseModel

class Msg(BaseModel):
    msg: str

class Message(BaseModel):
    message: str
