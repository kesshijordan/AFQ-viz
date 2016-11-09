__author__ = 'kjordan'

import cherrypy


class HelloWorld(object):
    @cherrypy.expose
    def index(self):
        return "Hello world!"

    @cherrypy.expose
    @cherrypy.tools.json_out()
    @cherrypy.tools.json_in()
    def generate(self):
        result = {"operation": "request", "result": "success"}

        input_json = cherrypy.request.json
        value = input_json #["my_key"]

        #All responses are serialized to JSON. This the same as
        #return simplejson.dumps(result)
        print("incoming data is", input_json)
        input_json["new_thing"] = "I am from the server"
        return input_json



if __name__ == '__main__':
    cherrypy.quickstart(HelloWorld(), "/", "Hello.config")
