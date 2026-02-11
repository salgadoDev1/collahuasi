const sql = require('mssql');
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
async function insertarDatos(data) {
  console.log('Datos recibidos:', data);

  try {
    const validColumns = await getTableColumns();

    const filteredData = data.map((row) => {
      const filteredRow = {};
      for (const key in row) {
        if (validColumns.includes(key)) {
          filteredRow[key] = row[key];
        }
      }
      return filteredRow;
    });

    console.log('Datos después de excluir columnas no válidas:', filteredData);

    if (filteredData.length === 0) {
      console.error('No hay datos válidos para insertar.');
      return;
    }

    const values = filteredData.map((row) => {
      return validColumns.map((col) => {
        let value = row[col] || null;

        if (value instanceof Date) {
          return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
        }

        if (value === null || value === '') {
          return 'NULL';
        }

        if (!isNaN(value)) {
          return value;
        }

        return `'${String(value).trim().replace(/'/g, "''")}'`;
      });
    });

    const batchSize = 300;

    const chunkArray = (arr, size) => {
      const result = [];
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
      }
      return result;
    };

    const chunks = chunkArray(values, batchSize);
    const pool = await sql.connect();

    for (const chunk of chunks) {
      const query = `
        INSERT INTO DatosMovimientos (${validColumns
          .map((col) => `[${col}]`)
          .join(', ')})
        VALUES ${chunk.map((row) => `(${row.join(', ')})`).join(', ')};
      `;

      console.log('Consulta SQL generada:', query.slice(0, 700));

      await pool.request().query(query);
    }

    console.log('Datos insertados con éxito en `DatosMovimientos`');
  } catch (error) {
    console.error('Error al insertar datos en la base de datos:', error);
    throw error;
  }
}

// function formatFecha(dateString) {
//   const fecha = new Date(dateString);
//   if (isNaN(fecha)) {
//     throw new Error("Fecha inválida");
//   }
//   return fecha.toISOString().split("T").join(" ").slice(0, 19);
// }

async function getUserInDB() {
  try {
    const query = 'SELECT * FROM Usuarios WHERE estado = 1 ORDER BY id DESC';
    const result = await sql.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error al obtener datos:', error);
    throw new Error('Error al obtener datos de la base de datos.');
  }
}
async function obtenerDatos() {
  try {
    const query = 'SELECT * FROM DatosMovimientos ORDER BY id DESC';
    const result = await sql.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error al obtener datos:', error);
    throw new Error('Error al obtener datos de la base de datos.');
  }
}
async function obtenerDatoscs() {
  try {
    const query = 'SELECT * FROM cs01_cs02_cs03 ORDER BY id DESC';
    const result = await sql.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error al obtener datos:', error);
    throw new Error('Error al obtener datos de la base de datos.');
  }
}
async function obtenerDatosMov() {
  try {
    const query = 'SELECT * FROM movimin_2 ORDER BY id DESC';
    const result = await sql.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error al obtener datos:', error);
    throw new Error('Error al obtener datos de la base de datos.');
  }
}
async function createUserInDB(nombre, email, perfil) {
  try {
    const request = new sql.Request();

    const result = await request
      .input('nombre', sql.NVarChar, nombre)
      .input('email', sql.NVarChar, email)
      .input('perfil', sql.Int, perfil)
      .input('estado', sql.Int, 1).query(`
        INSERT INTO Usuarios (nombre, email, estado, perfil)
        OUTPUT Inserted.id
        VALUES (@nombre, @email, @estado, @perfil)
      `);

    // console.log(result);

    if (result.recordset && result.recordset.length > 0) {
      const userId = result.recordset[0].id;
      console.log('ID del usuario creado:', userId);
      return userId;
    } else {
      throw new Error('No se devolvió ningún ID del usuario insertado');
    }
  } catch (error) {
    console.error('Error al crear usuario en la base de datos:', error);
    throw error;
  }
}
const createAuthForUserInDB = async (authData) => {
  try {
    const request = new sql.Request();

    request.input('fk_usuario_id', sql.Int, authData.fk_usuario_id);
    request.input('password', sql.NVarChar, authData.password);
    request.input('salt', sql.NVarChar, authData.salt);
    request.input('ultimo_login', sql.DateTime, authData.ultimo_login);
    request.input('intentos_fallidos', sql.Int, authData.intentos_fallidos);
    request.input('bloqueado', sql.Bit, authData.bloqueado ? 1 : 0);
    request.input(
      'token_recuperacion',
      sql.NVarChar,
      authData.token_recuperacion,
    );
    request.input('fecha_token', sql.DateTime, authData.fecha_token);
    request.input('totp_secret', sql.NVarChar, authData.totp_secret || null);
    request.input('totp_enabled', sql.Bit, authData.totp_enabled ? 1 : 0);
    request.input('user', sql.NVarChar, authData.user || authData.email?.split('@')[0] || 'unknown');

    await request.query(`
      INSERT INTO Auth (
        fk_usuario_id, password, salt, ultimo_login, intentos_fallidos, bloqueado, 
        token_recuperacion, fecha_token, totp_secret, totp_enabled, [user]
      ) VALUES (
        @fk_usuario_id, @password, @salt, @ultimo_login, @intentos_fallidos, @bloqueado,
        @token_recuperacion, @fecha_token, @totp_secret, @totp_enabled, @user
      )
    `);

    console.log('Registro en Auth creado correctamente');
  } catch (error) {
    console.error('Error al crear registro en Auth:', error);
    throw error;
  }
};
async function updateUserInDB(id, data) {
  try {
    const fields = [];
    const request = new sql.Request();

    if (data.nombre) {
      fields.push('nombre = @nombre');
      request.input('nombre', sql.NVarChar, data.nombre);
    }

    if (data.estado !== undefined) {
      fields.push('estado = @estado');
      request.input('estado', sql.Int, data.estado);
    }

    if (data.perfil) {
      fields.push('perfil = @perfil');
      request.input('perfil', sql.Int, data.perfil);
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    const updateQuery = `UPDATE Usuarios SET ${fields.join(
      ', ',
    )} WHERE id = @id`;
    request.input('id', sql.Int, id);
    await request.query(updateQuery);

    console.log('Usuario actualizado correctamente');

    const result = await request.query(
      'SELECT id, nombre, email, estado, perfil FROM Usuarios WHERE id = @id',
    );

    if (result.recordset.length === 0) {
      throw new Error('No se encontró el usuario actualizado');
    }

    return result.recordset[0];
  } catch (error) {
    console.error('Error al actualizar usuario en la base de datos:', error);
    throw error;
  }
}
async function deleteUserInDB(id) {
  try {
    const request = new sql.Request();
    await request
      .input('id', sql.Int, id)
      .input('estado', sql.Int, 9)
      .query('UPDATE Usuarios SET estado = @estado WHERE id = @id');
    console.log('Usuario eliminado correctamente (estado cambiado)');
  } catch (error) {
    console.error('Error al eliminar usuario en la base de datos:', error);
    throw error;
  }
}
async function updateLoginTime(userId) {
  try {
    const request = new sql.Request();
    await request
      .input('UserId', sql.Int, userId)
      .query(
        'UPDATE Auth SET ultimo_login = GETDATE() WHERE fk_usuario_id = @UserId',
      );
    console.log('Se actualizó el último login correctamente');
  } catch (error) {
    console.error('Error al actualizar el último login:', error);
    throw error;
  }
}
async function getAuthByEmail(email) {
  try {
    const request = new sql.Request();
    const query = `
      SELECT a.fk_usuario_id, a.password, a.salt, a.totp_secret, a.totp_enabled
      FROM Auth a
      JOIN Usuarios u ON a.fk_usuario_id = u.id
      WHERE u.email = @Email AND u.estado = 1
    `;
    request.input('Email', sql.NVarChar, email);
    const result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    console.error('Error al obtener credenciales de Auth:', error);
    throw error;
  }
}
async function getUserById(userId) {
  try {
    const request = new sql.Request();
    const query = `
      SELECT id, nombre, email, perfil, estado
      FROM Usuarios
      WHERE id = @UserId AND estado = 1
    `;
    request.input('UserId', sql.Int, userId);
    const result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    throw error;
  }
}
async function updateRecoveryToken(userId, token, fechaToken) {
  try {
    const request = new sql.Request();
    await request
      .input('fk_usuario_id', sql.Int, userId)
      .input('token_recuperacion', sql.NVarChar, token)
      .input('fecha_token', sql.DateTime, fechaToken).query(`
        UPDATE Auth 
        SET token_recuperacion = @token_recuperacion, fecha_token = @fecha_token 
        WHERE fk_usuario_id = @fk_usuario_id
      `);
    console.log('Token de recuperación actualizado');
  } catch (error) {
    console.error('Error al actualizar token de recuperación:', error);
    throw error;
  }
}
async function validateRecoveryToken(token) {
  try {
    const request = new sql.Request();
    const query = `
      SELECT fk_usuario_id, fecha_token 
      FROM Auth 
      WHERE token_recuperacion = @token
    `;
    request.input('token', sql.NVarChar, token);
    const result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    console.error('Error al validar token de recuperación:', error);
    throw error;
  }
}
async function updatePassword(userId, hashedPassword, salt) {
  try {
    const request = new sql.Request();
    await request
      .input('fk_usuario_id', sql.Int, userId)
      .input('password', sql.NVarChar, hashedPassword)
      .input('salt', sql.NVarChar, salt).query(`
        UPDATE Auth 
        SET password = @password, salt = @salt, token_recuperacion = NULL, fecha_token = NULL 
        WHERE fk_usuario_id = @fk_usuario_id
      `);
    console.log('Contraseña actualizada correctamente');
  } catch (error) {
    console.error('Error al actualizar la contraseña:', error);
    throw error;
  }
}
async function insertarDatosCs01Cs02Cs03(data) {
  try {
    console.log('insertarDatosCs01Cs02Cs03 - Primer objeto recibido:', data[0]);
    console.log(
      'insertarDatosCs01Cs02Cs03 - Claves:',
      Object.keys(data[0] || {}),
    );

    const columnMapping = [
      'Fecha',
      'Ton',
      'CuT',
      'CuS',
      'AsT',
      'MoT',
      'FeT',
      'tph',
      'rcu',
      'rmo',
      'Dif',
      'Report VPOM',
      'Operativo',
      'Chancado & Correa',
      'tpha',
      'rcu.1',
      'rmo.1',
      '% solid planta',
      'M',
      'rec limp',
      'Restricción L1',
      'Restricción L2',
      'Restricción L3',
      'p80',
      'SAG 1',
      'SAG 2',
      'SAG 1011',
      'Línea 1',
      'Línea 2',
      'Línea 3',
      'MB 3',
      'MB 4',
      'MB 1012',
      'MB 1013',
      'MB 3.1',
      'MB 4.1',
      'MB 1012.1',
      'MB 1013.1',
      'token',
      'nombre_archivo',
    ];

    const normalizeColumnName = (name) => name.trim().replace(/\s+/g, ' ');

    const keysFromData = Object.keys(data[0] || {}).map(normalizeColumnName);
    const normalizedColumnMapping = columnMapping.map(normalizeColumnName);

    const missingColumns = normalizedColumnMapping.filter(
      (col) => !keysFromData.includes(col),
    );
    // if (missingColumns.length > 0) {
    //   console.error("Columnas faltantes en data:", missingColumns);
    //   throw new Error(
    //     "Las columnas de data no coinciden con la base de datos."
    //   );
    // }

    const stringColumns = ['Fecha', 'token', 'nombre_archivo'];

    const numericColumns = [
      'Ton',
      'CuT',
      'CuS',
      'AsT',
      'MoT',
      'FeT',
      'tph',
      'rcu',
      'rmo',
      'Dif',
      'tpha',
      'rcu.1',
      'rmo.1',
      '% solid planta',
      'M',
      'rec limp',
      'p80',
      'SAG 1',
      'SAG 2',
      'SAG 1011',
      'Línea 1',
      'Línea 2',
      'Línea 3',
      'MB 3',
      'MB 4',
      'MB 1012',
      'MB 1013',
      'MB 3.1',
      'MB 4.1',
      'MB 1012.1',
      'MB 1013.1',
    ];

    const values = data.map((row, rowIndex) => {
      return normalizedColumnMapping.map((col, colIndex) => {
        let value = row[col];

        if (value === undefined || value === null || value === '') {
          return 'NULL';
        }

        if (col === 'Fecha') {
          let dateVal;
          if (value instanceof Date) {
            dateVal = value;
          } else {
            dateVal = new Date(value);
          }
          if (!isNaN(dateVal.getTime())) {
            return `'${dateVal.toISOString().slice(0, 19).replace('T', ' ')}'`;
          }
          return 'NULL';
        }

        if (numericColumns.includes(col)) {
          if (typeof value === 'number') {
            return String(value);
          }
          if (typeof value === 'string') {
            let cleaned = value.trim().replace(/%/g, '');
            if (cleaned === '-' || cleaned === '') {
              return 'NULL';
            }
            let num = parseFloat(cleaned);
            if (!isNaN(num)) {
              return String(num);
            }
            console.error(
              `⚠️ Valor no numérico en columna numérica "${col}" (fila ${rowIndex + 1
              }):`,
              value,
            );
            return 'NULL';
          }
          return 'NULL';
        }

        if (stringColumns.includes(col)) {
          let cleaned = String(value).trim();
          return cleaned ? `'${cleaned.replace(/'/g, "''")}'` : 'NULL';
        }

        let cleaned = String(value).trim();
        return cleaned ? `'${cleaned.replace(/'/g, "''")}'` : 'NULL';
      });
    });

    const batchSize = 100;

    const chunkArray = (arr, size) => {
      const result = [];
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
      }
      return result;
    };

    const chunks = chunkArray(values, batchSize);

    const pool = await sql.connect();

    for (const chunk of chunks) {
      const query = `
        INSERT INTO CS01_CS02_CS03 (${normalizedColumnMapping
          .map((col) => `[${col}]`)
          .join(', ')})
        VALUES ${chunk.map((row) => `(${row.join(', ')})`).join(', ')};
      `;

      console.log(
        '🟢 Consulta SQL generada (primeros 1000 caracteres):',
        query.slice(0, 1000),
      );
      console.log('🔍 Valores para la primera fila:', values[0]);
      console.log(
        '🔍 Tipos de datos esperados:',
        normalizedColumnMapping.map((col) => ({
          column: col,
          type: stringColumns.includes(col)
            ? 'varchar'
            : numericColumns.includes(col)
              ? 'numeric'
              : 'varchar',
        })),
      );

      await pool.request().query(query);
    }

    console.log('✅ Datos insertados con éxito en CS01+CS02+CS03');
  } catch (error) {
    console.error('🚨 Error al insertar datos en la base de datos:', error);
    throw error;
  }
}
async function insertarDatosMovimin(data) {
  try {
    console.log('insertarDatosCs01Cs02Cs03 - Primer objeto recibido:', data[0]);
    console.log(
      'insertarDatosCs01Cs02Cs03 - Claves:',
      Object.keys(data[0] || {}),
    );

    const columnMapping = [
      'fecha',
      'ton',
      'cut',
      'cus',
      'ast',
      'mot',
      'fet',
      'au',
      'ag',
      'dwi',
      'bwi',
      'ai',
      'vsed',
      'ph',
      'tpd_agua',
      'dens',
      'factor_a',
      'tpha',
      'rcum_mp',
      'rmom_mp',
      'pirofilita',
      'kaolinita',
      'illita',
      'muscovita',
      'suma_arcillas',
      'suma_arcillas_2',
      'ugm2',
      'ugm3',
      'ugm4',
      'ugm5',
      'ugm6',
      'ugm11',
      'ugm12',
      'ugm13',
      'ugm14',
      'r1',
      'r2',
      'pq',
      'r3',
      'sw',
      'bornita',
      'calcosina',
      'calcopirita',
      'covelina',
      'enargita',
      'pirita',
      'ucs',
      'grlb_gt80',
      'grlb_ocl',
      'p80_m',
      'tpo_resid',
      'ugf1',
      'ugf2',
      'ugf3',
      'ugf4',
      'ugf5',
      'rec_glob',
      'token',
      'nombre_archivo',
    ];

    const values = data.map((row) => {
      return columnMapping.map((col) => {
        let value = row[col];

        if (value === undefined || value === null || value === '') {
          return 'NULL';
        }

        if (typeof value === 'string') {
          value = value.replace(/\s+/g, '').replace(',', '.');
          if (/^\d+(\.\d+)?$/.test(value)) {
            value = parseFloat(value);
          } else {
            return `'${value.replace(/'/g, "''")}'`;
          }
        }

        if (typeof value === 'number') {
          return value;
        }

        if (value instanceof Date) {
          return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
        }

        return `'${String(value).trim().replace(/'/g, "''")}'`;
      });
    });

    const batchSize = 100;

    const chunkArray = (arr, size) => {
      const result = [];
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
      }
      return result;
    };

    const chunks = chunkArray(values, batchSize);

    const pool = await sql.connect();

    for (const chunk of chunks) {
      const query = `
        INSERT INTO movimin_2 (${columnMapping
          .map((col) => `[${col}]`)
          .join(', ')})
        VALUES ${chunk.map((row) => `(${row.join(', ')})`).join(', ')};
      `;

      console.log('Consulta SQL generada:', query.slice(0, 1000));

      await pool.request().query(query);
    }

    console.log('Datos insertados con éxito en cs01_cs02_cs03');
  } catch (error) {
    console.error('Error al insertar datos en la nueva tabla:', error);
    throw error;
  }
}
async function addColumnToDatosMovimientos(columnName, columnType) {
  try {
    const pool = await sql.connect();
    const query = `ALTER TABLE DatosMovimientos ADD [${columnName}] ${columnType}`;
    await pool.request().query(query);
    console.log(
      `Columna '${columnName}' agregada exitosamente a DatosMovimientos`,
    );
  } catch (error) {
    console.error(
      'Error al agregar columna a la tabla DatosMovimientos:',
      error,
    );
    throw error;
  }
}
async function deleteExcelData(token) {
  try {
    const pool = await sql.connect();

    await pool
      .request()
      .input('token', sql.NVarChar, token)
      .query('DELETE FROM DatosMovimientos WHERE token = @token');

    await pool
      .request()
      .input('token', sql.NVarChar, token)
      .query('DELETE FROM cs01_cs02_cs03 WHERE token = @token');

    await pool
      .request()
      .input('token', sql.NVarChar, token)
      .query('DELETE FROM movimin_2 WHERE token = @token');

    console.log('Registros eliminados para el token:', token);
  } catch (error) {
    console.error('Error en deleteExcelData:', error);
    throw error;
  }
}
async function getTableColumns() {
  try {
    const pool = await sql.connect();
    const query = `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'DatosMovimientos' AND COLUMNPROPERTY(object_id(TABLE_NAME), COLUMN_NAME, 'IsIdentity') = 0
    `;
    const result = await pool.request().query(query);
    const columns = result.recordset.map((row) => row.COLUMN_NAME);
    console.log('Columnas obtenidas de DatosMovimientos:', columns);
    return columns;
  } catch (error) {
    console.error(
      'Error al obtener las columnas de la tabla DatosMovimientos:',
      error,
    );
    throw error;
  }
}
async function getUniqueFileNames() {
  try {
    const query = `
      SELECT DISTINCT token, nombre_archivo
      FROM DatosMovimientos
      WHERE nombre_archivo IS NOT NULL
      ORDER BY nombre_archivo
    `;
    const result = await sql.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error al obtener nombres de archivo únicos:', error);
    throw new Error('Error al obtener nombres de archivo de la base de datos.');
  }
}
async function getReporte1(
  origen = '',
  destino = '',
  material = '',
  fase = '',
) {
  const pool = await sql.connect();

  let whereClauses = [];
  if (origen) whereClauses.push(`Origen = @origen`);
  if (destino) whereClauses.push(`Destino = @destino`);
  if (material) whereClauses.push(`Material = @material`);
  if (fase) whereClauses.push(`Fase = @fase`);

  let query = `
    WITH DatosAjustados AS (
      SELECT
        CASE
          WHEN CONVERT(date, Fecha) = EOMONTH(Fecha)
            THEN DATEADD(day, 1, CONVERT(date, Fecha))
          ELSE CONVERT(date, Fecha)
        END AS FechaAjustada,
        Tonelaje, CuT, CuS, [As], MoT, FeT, Au, Ag, DWI, BWI, AI, VSED, CALC_PH_POND, TPD_AGUA, TPH_TOTAL, DENSIDAD, Factor_A, Tpht_mp, Rmom_mp, arc_piro, arc_kao, arc_mont, arc_musc, Suma_Arcillas, UGM_1, UGM_2, UGM_3, UGM_4, UGM_5, UGM_6, UGM_11, UGM_12, UGM_13, UGM_14, R1, R2, PQ, SW, Origen, Destino, Material, Fase
      FROM DatosMovimientos
      ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''}
    )
    SELECT
      YEAR(FechaAjustada) AS año,
      MONTH(FechaAjustada) AS mes,
      SUM(Tonelaje) AS tonaje,
      SUM(CuT * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS CuT,
      SUM(CuS * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS CuS,
      SUM([As] * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS [As],
      SUM(MoT * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS MoT,
      SUM(FeT * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS FeT,
      SUM(Au * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS Au,
      SUM(Ag * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS Ag,
      SUM(DWI * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS DWI,
      SUM(BWI * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS BWI,
      SUM(AI * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS AI,
      SUM(VSED * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS VSED,
      SUM(CALC_PH_POND * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS CALC_PH_POND,
      SUM(TPD_AGUA * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS TPD_AGUA,
      SUM(TPH_TOTAL * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS TPH_TOTAL,
      SUM(DENSIDAD * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS DENSIDAD,
      SUM(Factor_A * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS Factor_A,
      SUM(Tpht_mp * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS Tpht_mp,
      SUM(Rmom_mp * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS Rmom_mp,
      SUM(arc_piro * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS arc_piro,
      SUM(arc_kao * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS arc_kao,
      SUM(arc_mont * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS arc_mont,
      SUM(arc_musc * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS arc_musc,
      SUM(Suma_Arcillas * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS Suma_Arcillas,
      SUM(UGM_1 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_1,
      SUM(UGM_2 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_2,
      SUM(UGM_3 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_3,
      SUM(UGM_4 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_4,
      SUM(UGM_5 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_5,
      SUM(UGM_6 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_6,
      SUM(UGM_11 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_11,
      SUM(UGM_12 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_12,
      SUM(UGM_13 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_13,
      SUM(UGM_14 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_14,
      SUM(R1 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS R1,
      SUM(R2 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS R2,
      SUM(PQ * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS PQ,
      SUM(SW * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS SW
    FROM DatosAjustados
    GROUP BY YEAR(FechaAjustada), MONTH(FechaAjustada)
    ORDER BY YEAR(FechaAjustada), MONTH(FechaAjustada);
  `;

  // Depuración: mostramos la consulta generada
  console.log('Consulta SQL generada:', query);

  const request = pool.request();
  if (origen) {
    request.input('origen', sql.NVarChar, origen);
  }
  if (destino) {
    request.input('destino', sql.NVarChar, destino);
  }
  if (material) {
    request.input('material', sql.NVarChar, material);
  }
  if (fase) {
    request.input('fase', sql.NVarChar, fase);
  }

  const result = await request.query(query);
  return result.recordset;
}
async function getReporte2(
  año,
  mes,
  origen = '',
  destino = '',
  material = '',
  fase = '',
) {
  const pool = await sql.connect();

  let whereClauses = [];
  if (origen) whereClauses.push(`Origen = @origen`);
  if (destino) whereClauses.push(`Destino = @destino`);
  if (material) whereClauses.push(`Material = @material`);
  if (fase) whereClauses.push(`Fase = @fase`);

  let query = `
    WITH DatosAjustados AS (
      SELECT
        CASE
          WHEN CONVERT(date, Fecha) = EOMONTH(Fecha)
            THEN DATEADD(day, 1, CONVERT(date, Fecha))
          ELSE CONVERT(date, Fecha)
        END AS FechaAjustada,
        Tonelaje, CuT, CuS, [As], MoT, FeT, Au, Ag, DWI, BWI, AI, VSED, CALC_PH_POND, TPD_AGUA, TPH_TOTAL, DENSIDAD, Factor_A, Suma_Arcillas, R1, R2, PQ, SW, Tpht_mp, Rmom_mp, arc_piro, arc_kao, arc_mont, arc_musc, UGM_1, UGM_2, UGM_3, UGM_4, UGM_5, UGM_6, UGM_11, UGM_12, UGM_13, UGM_14, Origen, Destino, Material, Fase
      FROM DatosMovimientos
      ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''}
    )
    SELECT
      DAY(FechaAjustada)                             AS día,
      SUM(Tonelaje)                                  AS tonaje,
      SUM(CuT  * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS CuT,
      SUM(CuS  * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS CuS,
      SUM([As] * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS [As],
      SUM(MoT  * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS MoT,
      SUM(FeT  * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS FeT,
      SUM(Au   * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS Au,
      SUM(Ag   * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS Ag,
      SUM(DWI  * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS DWI,
      SUM(BWI  * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS BWI,
      SUM(AI   * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS AI,
      SUM(VSED * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS VSED,
      SUM(CALC_PH_POND * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS CALC_PH_POND,
      SUM(TPD_AGUA * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS TPD_AGUA,
      SUM(TPH_TOTAL * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS TPH_TOTAL,
      SUM(DENSIDAD * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS DENSIDAD,
      SUM(Factor_A * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS Factor_A,
      SUM(Suma_Arcillas * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS Suma_Arcillas,
      SUM(R1 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS R1,
      SUM(R2 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS R2,
      SUM(PQ * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS PQ,
      SUM(SW * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS SW,
      SUM(Tpht_mp * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS Tpht_mp,
      SUM(Rmom_mp * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS Rmom_mp,
      SUM(arc_piro * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS arc_piro,
      SUM(arc_kao * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS arc_kao,
      SUM(arc_mont * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS arc_mont,
      SUM(arc_musc * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS arc_musc,
      SUM(UGM_1 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_1,
      SUM(UGM_2 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_2,
      SUM(UGM_3 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_3,
      SUM(UGM_4 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_4,
      SUM(UGM_5 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_5,
      SUM(UGM_6 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_6,
      SUM(UGM_11 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_11,
      SUM(UGM_12 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_12,
      SUM(UGM_13 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_13,
      SUM(UGM_14 * Tonelaje) / NULLIF(SUM(Tonelaje), 0) AS UGM_14
    FROM DatosAjustados
    WHERE FechaAjustada BETWEEN DATEFROMPARTS(@year, @month, 1) AND DATEADD(DAY, -1, DATEADD(MONTH, 1, DATEFROMPARTS(@year, @month, 1)))
    GROUP BY DAY(FechaAjustada)
    ORDER BY DAY(FechaAjustada);
  `;

  console.log('Consulta SQL generada para getReporte2:', query);

  const request = pool
    .request()
    .input('year', sql.Int, año)
    .input('month', sql.Int, mes);

  if (origen) {
    request.input('origen', sql.NVarChar, origen);
  }
  if (destino) {
    request.input('destino', sql.NVarChar, destino);
  }
  if (material) {
    request.input('material', sql.NVarChar, material);
  }
  if (fase) {
    request.input('fase', sql.NVarChar, fase);
  }

  const result = await request.query(query);
  return result.recordset;
}
async function getReporteMinaVsPlanta(año, mes) {
  try {
    const pool = await sql.connect();
    console.log(
      `Obteniendo datos para Reporte Mina vs Planta: año=${año}, mes=${mes}`,
    );

    const result = await pool
      .request()
      .input('año', sql.Int, año)
      .input('mes', sql.Int, mes).query(`
        DECLARE 
          @startDate DATE = DATEFROMPARTS(@año, @mes, 1),
          @endDate   DATE = DATEADD(DAY, -1, DATEADD(MONTH, 1, DATEFROMPARTS(@año, @mes, 1)));

        -- Planta
        SELECT
          CAST(Fecha AS DATE) AS Fecha,
          ISNULL(Ton, 0)  AS Ton,
          ISNULL(CuT, 0)  AS CuT,
          ISNULL(CuS, 0)  AS CuS,
          ISNULL(AsT, 0)  AS AsT,
          ISNULL(MoT, 0)  AS MoT,
          ISNULL(FeT, 0)  AS FeT,
          ISNULL(rcu, 0)  AS rcu, -- Campo de recuperación rcu en Planta
          'planta'       AS source,
          CAST(NULL AS DATE)   AS MoviminFecha,
          CAST(NULL AS FLOAT)  AS ton,
          CAST(NULL AS FLOAT)  AS cut,
          CAST(NULL AS FLOAT)  AS cus,
          CAST(NULL AS FLOAT)  AS ast,
          CAST(NULL AS FLOAT)  AS mot,
          CAST(NULL AS FLOAT)  AS fet,
          CAST(NULL AS FLOAT)  AS rec_glob
        FROM cs01_cs02_cs03
        WHERE Fecha BETWEEN @startDate AND @endDate

        UNION ALL

        -- Movimin
        SELECT
          CAST(NULL AS DATE)   AS Fecha,
          CAST(NULL AS FLOAT)  AS Ton,
          CAST(NULL AS FLOAT)  AS CuT,
          CAST(NULL AS FLOAT)  AS CuS,
          CAST(NULL AS FLOAT)  AS AsT,
          CAST(NULL AS FLOAT)  AS MoT,
          CAST(NULL AS FLOAT)  AS FeT,
          CAST(NULL AS FLOAT)  AS rcu, -- Campo rcu nulo para movimin
          'movimin'       AS source,
          CAST(fecha AS DATE)  AS MoviminFecha,
          ISNULL(ton, 0)  AS ton,
          ISNULL(cut, 0)  AS cut,
          ISNULL(cus, 0)  AS cus,
          ISNULL(ast, 0)  AS ast,
          ISNULL(mot, 0)  AS mot,
          ISNULL(fet, 0)  AS fet,
          ISNULL(rec_glob, 0) AS rec_glob -- Campo de recuperación rec_glob en movimin
        FROM movimin_2
        WHERE fecha BETWEEN @startDate AND @endDate;
      `);

    const plantaRows = result.recordset.filter((r) => r.source === 'planta');
    const moviminRows = result.recordset.filter((r) => r.source === 'movimin');

    const moviminMap = new Map();
    moviminRows.forEach((row) => {
      const key = row.MoviminFecha.toISOString().slice(0, 10);
      moviminMap.set(key, row);
    });

    const pctChange = (nuevo, original) =>
      original > 0 ? ((nuevo - original) / original) * 100 : 0;

    const plantaData = plantaRows.map((row) => {
      const fechaStr = row.Fecha.toISOString().slice(0, 10);
      const mov = moviminMap.get(fechaStr) || {};

      return {
        Fecha: fechaStr,
        Ton: row.Ton,
        CuT: row.CuT,
        CuS: row.CuS,
        AsT: row.AsT,
        MoT: row.MoT,
        FeT: row.FeT,
        rcu: row.rcu, // Campo de recuperación rcu, sin diferencia
        Dif_AsT: Number(pctChange(row.AsT, mov.ast).toFixed(1)),
        Dif_CuT: Number(pctChange(row.CuT, mov.cut).toFixed(1)),
        Dif_MoT: Number(pctChange(row.MoT, mov.mot).toFixed(1)),
      };
    });

    // Movimin puro
    const moviminData = moviminRows.map((row) => ({
      fecha: row.MoviminFecha.toISOString().slice(0, 10),
      ton: row.ton,
      cut: row.cut,
      cus: row.cus,
      ast: row.ast,
      mot: row.mot,
      fet: row.fet,
      rec_glob: row.rec_glob, // Campo de recuperación rec_glob
    }));

    console.log('Reporte procesado:', {
      plantaData: plantaData.slice(0, 5),
      moviminData: moviminData.slice(0, 5),
    });

    return { plantaData, moviminData };
  } catch (error) {
    console.error('Error al obtener Reporte Mina vs Planta:', error);
    throw new Error(
      'Error al obtener Reporte Mina vs Planta: ' + error.message,
    );
  }
}

async function getOrigenes() {
  const pool = await sql.connect();
  const result = await pool.request().query(`
    SELECT DISTINCT Origen
    FROM DatosMovimientos
    WHERE Origen IS NOT NULL
    ORDER BY Origen;
  `);
  return result.recordset.map((row) => row.Origen);
}
async function getDestinos() {
  const pool = await sql.connect();
  const result = await pool.request().query(`
    SELECT DISTINCT Destino
    FROM DatosMovimientos
    WHERE Destino IS NOT NULL
    ORDER BY Destino;
  `);
  return result.recordset.map((row) => row.Destino);
}
async function getMateriales() {
  const pool = await sql.connect();
  const result = await pool.request().query(`
    SELECT DISTINCT Material
    FROM DatosMovimientos
    WHERE Material IS NOT NULL
    ORDER BY Material;
  `);
  return result.recordset.map((row) => row.Material);
}
async function getFase() {
  const pool = await sql.connect();
  const result = await pool.request().query(`
    SELECT DISTINCT Fase
    FROM DatosMovimientos
    WHERE Fase IS NOT NULL
    ORDER BY Fase;
  `);
  return result.recordset.map((row) => row.Fase);
}

async function update2FAInDB(userId, totp_secret, totp_enabled) {
  try {
    const request = new sql.Request();
    await request
      .input('fk_usuario_id', sql.Int, userId)
      .input('totp_secret', sql.NVarChar, totp_secret)
      .input('totp_enabled', sql.Bit, totp_enabled ? 1 : 0).query(`
        UPDATE Auth 
        SET totp_secret = @totp_secret, totp_enabled = @totp_enabled
        WHERE fk_usuario_id = @fk_usuario_id
      `);
    console.log('Datos de 2FA actualizados correctamente');
  } catch (error) {
    console.error('Error al actualizar datos de 2FA:', error);
    throw error;
  }
}

module.exports = {
  insertarDatos,
  obtenerDatos,
  createUserInDB,
  updateUserInDB,
  deleteUserInDB,
  createAuthForUserInDB,
  getUserInDB,
  getAuthByEmail,
  getUserById,
  updateLoginTime,
  updateRecoveryToken,
  validateRecoveryToken,
  updatePassword,
  insertarDatosCs01Cs02Cs03,
  insertarDatosMovimin,
  obtenerDatoscs,
  obtenerDatosMov,
  addColumnToDatosMovimientos,
  getTableColumns,
  deleteExcelData,
  getUniqueFileNames,
  getReporte1,
  getReporte2,
  getReporteMinaVsPlanta,
  getOrigenes,
  getDestinos,
  getMateriales,
  getFase,
  update2FAInDB,
};
