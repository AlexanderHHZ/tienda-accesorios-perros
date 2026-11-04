export class ErrorAplicacion extends Error {constructor(message,{estadoHttp=400}={}){super(message);this.status=estadoHttp;}}
export class ErrorCredenciales extends ErrorAplicacion {constructor(){super('Credenciales incorrectas',{estadoHttp:401});}}
