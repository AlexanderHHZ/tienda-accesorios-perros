// Adaptador de consultas MySQL del servicio original al repositorio SQLite local.
let db;
exports.attach=d=>{db=d;};
exports.query=async(sql,params=[])=>{
 const q=db.prepare(sql);
 if(/^\s*SELECT/i.test(sql))return [q.all(...params)];
 const r=q.run(...params);return [{insertId:Number(r.lastInsertRowid),affectedRows:r.changes}];
};
