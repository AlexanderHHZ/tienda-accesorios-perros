"""Pasarela local persistente. Reutiliza evaluar() del ZIP, sin recibir tarjetas reales."""
import os,json,sqlite3,hmac
from pathlib import Path
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from rules import evaluar
ROOT=Path(__file__).resolve().parents[2]
if (ROOT/'.env').exists():
    for line in (ROOT/'.env').read_text().splitlines():
        if '=' in line and not line.startswith('#'):
            k,v=line.split('=',1);os.environ.setdefault(k,v)
DATA=Path(os.environ.get('DATA_DIR','data'))
if not DATA.is_absolute(): DATA=ROOT/DATA
DATA.mkdir(parents=True,exist_ok=True)
DB=DATA/'payments.sqlite'
with sqlite3.connect(DB) as db:
    db.execute('CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY, amount INTEGER, token TEXT, status TEXT, motivo TEXT, ultimos4 TEXT)')
TOKENS={'demo_approved':'4242424242424242','demo_declined':'4000000000000002'}
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def reply(self,status,data):
        raw=json.dumps(data).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw)
    def do_GET(self):
        if self.path=='/health': return self.reply(200,{'ok':True,'service':'payments','mode':'demo'})
        self.reply(404,{'message':'Ruta no encontrada'})
    def do_POST(self):
        secret=os.environ.get('INTERNAL_SECRET','')
        if not secret or not hmac.compare_digest(self.headers.get('X-Internal-Key',''),secret):return self.reply(403,{'message':'Acceso interno requerido'})
        if self.path not in ['/internal/payments','/internal/refunds']:return self.reply(404,{'message':'Ruta no encontrada'})
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 0<size<8192:raise ValueError()
            b=json.loads(self.rfile.read(size))
            if self.path=='/internal/refunds':
                with sqlite3.connect(DB,timeout=10) as db:
                    db.row_factory=sqlite3.Row;db.execute('BEGIN IMMEDIATE')
                    old=db.execute('SELECT * FROM payments WHERE id=?',(b['id'],)).fetchone()
                    if not old:return self.reply(404,{'message':'Pago inexistente'})
                    if old['status'] not in ['APPROVED','REFUNDED']:return self.reply(409,{'message':'Pago no reembolsable'})
                    db.execute("UPDATE payments SET status='REFUNDED',motivo='Reembolso completo simulado' WHERE id=?",(b['id'],))
                    result=dict(db.execute('SELECT * FROM payments WHERE id=?',(b['id'],)).fetchone())
                result.pop('token',None);return self.reply(200,result)
            key=b['id']; amount=b['amount']; token=b['token']
            if not isinstance(key,str) or not 10<=len(key)<=100 or type(amount)!=int or not 0<amount<100000000 or token not in TOKENS: raise ValueError()
            with sqlite3.connect(DB,timeout=10) as db:
                db.row_factory=sqlite3.Row;db.execute('BEGIN IMMEDIATE')
                old=db.execute('SELECT * FROM payments WHERE id=?',(key,)).fetchone()
                if old:
                    if old['amount']!=amount or old['token']!=token:return self.reply(409,{'message':'Clave de pago incompatible'})
                    result=dict(old)
                else:
                    number=TOKENS[token]; status,motivo,_=evaluar(number)
                    db.execute('INSERT INTO payments VALUES(?,?,?,?,?,?)',(key,amount,token,status.value,motivo,number[-4:]));result=dict(db.execute('SELECT * FROM payments WHERE id=?',(key,)).fetchone())
            result.pop('token',None);self.reply(200,result)
        except (KeyError,ValueError,TypeError,json.JSONDecodeError): self.reply(400,{'message':'Solicitud de pago inválida'})
        except Exception: self.reply(500,{'message':'Error de pagos'})
if __name__=='__main__':
    if os.environ.get('PAYMENT_MODE','demo')!='demo':raise SystemExit('Solo PAYMENT_MODE=demo está implementado')
    print('payments: listo',flush=True)
    ThreadingHTTPServer((os.environ.get('HOST','127.0.0.1'),int(os.environ.get('PAYMENTS_PORT','4103'))),Handler).serve_forever()
