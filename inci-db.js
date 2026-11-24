// ══════════════════════════════════════════════════════════════════════════════
// inci-db.js — BASE ÚNICA DE INGREDIENTES GAROA (16/11/2026)
// Decisión de Sarai: «no puede haber dos listas distintas». Una sola lista y un solo criterio
// para herramienta-inci.html y herramienta-asesorias.html (las dos cargan este archivo).
// Script clásico (no módulo): todo queda en el ámbito global.
// Contiene: INCI_DB (con todas las ampliaciones aplicadas al cargar, en el mismo orden de siempre),
// reglas por familia (MINERAL_CI, QUIM, BOT_FIN, regla), distancia (erratas), checkPEG, CAT_LABELS,
// LACTANCIA_LABELS, TRADUCCION_AFECCIONES + traducirClienta, parser INCI, resolverAlias,
// calcularSeveridadPersonalizada y notaPersonalizada.
// Para añadir o cambiar un ingrediente: SOLO aquí. Después copiar este archivo a ~/.claude/laro-www/
// junto con las herramientas.
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// BASE DE DATOS INCI
// ══════════════════════════════════════════════════════════════════════════════
const INCI_DB = {
  // ── FRAGANCIAS ────────────────────────────────────────────────────────────
  // PARFUM → rojo (mezcla sintética opaca, incompatible con cosmética natural)
  'PARFUM': { nombre_com:'Parfum / Fragrance', categorias:['fragrance_sintetica'], severidad:'rojo', nota:'Mezcla no declarada de compuestos aromáticos sintéticos. Incompatible con cosmética natural y orgánica. Principal causa de alergia de contacto en cosmética. En la UE obliga a declarar 26 alérgenos específicos cuando superan el umbral.', lactancia:'precaucion', afecciones_relevantes:['rosácea','piel_sensible','dermatitis'] },
  'FRAGRANCE': { alias:'PARFUM' },
  'AROMA': { alias:'PARFUM' },

  // AE naturales (Anexo III UE, pero de origen botánico — verde si no hay PARFUM ni barrera comprometida)
  'LINALOOL': { nombre_com:'Linalool', categorias:['fragrance_ae'], severidad:'verde', nota:'Compuesto aromático natural presente en lavanda, cilantro, bergamota y muchos aceites esenciales. Declarado en el Anexo III UE por superar el umbral de alerta. En cosmética orgánica es aceptable a concentraciones adecuadas con barrera cutánea íntegra. Se oxida con el aire aumentando su alergenia — relevante en productos muy abiertos o caducados.', lactancia:'ok', afecciones_relevantes:['dermatitis','piel_sensible'] },
  'LIMONENE': { nombre_com:'Limoneno', categorias:['fragrance_ae'], severidad:'verde', nota:'Terpeno natural abundante en aceites cítricos (limón, naranja, bergamota). Declarado en Anexo III UE. En cosmética orgánica aceptable a dosis adecuadas. Importante: se oxida rápidamente con el aire incrementando su potencial alergénico — comprobar fecha de apertura.', lactancia:'ok', afecciones_relevantes:['dermatitis','piel_sensible'] },
  'CITRONELLOL': { nombre_com:'Citronelol', categorias:['fragrance_ae'], severidad:'verde', nota:'Alcohol terpénico natural presente en aceite de rosa y geranio. Declarado en Anexo III UE. Aceptable en cosmética orgánica a concentraciones apropiadas.', lactancia:'ok' },
  'GERANIOL': { nombre_com:'Geraniol', categorias:['fragrance_ae'], severidad:'verde', nota:'Alcohol terpénico natural presente en aceite de rosa, geranio y palmarosa. Declarado en Anexo III UE. Aceptable en cosmética orgánica.', lactancia:'ok' },
  'EUGENOL': { nombre_com:'Eugenol', categorias:['fragrance_ae','irritante'], severidad:'verde', nota:'Principal componente del aceite esencial de clavo y canela. Declarado en Anexo III UE. En cosmética orgánica aceptable a bajas concentraciones. Irritante en mucosas y piel sensible — precaución en pieles delicadas.', lactancia:'precaucion', afecciones_relevantes:['piel_sensible','rosácea'] },
  'COUMARIN': { nombre_com:'Cumarina', categorias:['fragrance_ae'], severidad:'verde', nota:'Compuesto natural de tonka, lavanda y canela. Declarado en Anexo III UE. Hepatotóxico en dosis altas (uso oral) pero seguro en cosmética a concentraciones habituales. Aceptable en cosmética orgánica.', lactancia:'precaucion' },
  'CINNAMAL': { nombre_com:'Cinamal', categorias:['fragrance_ae','irritante'], severidad:'verde', nota:'Aldehído natural del aceite esencial de canela. Declarado en Anexo III UE. En cosmética orgánica aceptable a dosis bajas. Frecuente causa de dermatitis de contacto — usar con precaución en piel sensible.', lactancia:'precaucion', afecciones_relevantes:['dermatitis','piel_sensible'] },
  'BENZYL ALCOHOL': { nombre_com:'Alcohol bencílico', categorias:['fragrance_ae','conservante_controvertido'], severidad:'verde', nota:'Presente de forma natural en jazmín y ylang ylang. También usado como conservante de síntesis. Declarado en Anexo III UE. Cuando aparece en un producto sin PARFUM es probable origen natural. Bien tolerado a bajas concentraciones.', lactancia:'precaucion' },
  'BENZYL SALICYLATE': { nombre_com:'Salicilato de bencilo', categorias:['fragrance_ae'], severidad:'verde', nota:'Presente en ylang ylang y otras flores. Declarado en Anexo III UE. Aceptable en cosmética orgánica. Posible actividad hormonal débil a concentraciones muy altas.', lactancia:'precaucion' },
  'BENZYL BENZOATE': { nombre_com:'Benzoato de bencilo', categorias:['fragrance_ae'], severidad:'verde', nota:'Presente en ylang ylang y bálsamos naturales. Declarado en Anexo III UE. Usado también como acaricida en medicina. Irritante en concentraciones elevadas.', lactancia:'precaucion' },
  'CINNAMYL ALCOHOL': { nombre_com:'Alcohol cinamílico', categorias:['fragrance_ae','irritante'], severidad:'verde', nota:'Compuesto natural del aceite esencial de canela. Declarado en Anexo III UE. Aceptable en cosmética orgánica a dosis adecuadas.', lactancia:'precaucion' },
  'CITRAL': { nombre_com:'Citral', categorias:['fragrance_ae'], severidad:'verde', nota:'Terpeno natural de limoncillo, verbena, aceites cítricos y hierba luisa. Declarado en Anexo III UE. Aceptable en cosmética orgánica.', lactancia:'ok' },
  'FARNESOL': { nombre_com:'Farnesol', categorias:['fragrance_ae'], severidad:'verde', nota:'Sesquiterpeno natural presente en aceite de rosa, ylang ylang y manzanilla. Declarado en Anexo III UE. Aceptable en cosmética orgánica.', lactancia:'ok' },
  'ISOEUGENOL': { nombre_com:'Isoeugenol', categorias:['fragrance_ae','irritante'], severidad:'verde', nota:'Presente en ylang ylang y clavel. Declarado en Anexo III UE. Uno de los más frecuentes en reacciones alérgicas por cosmética — precaución en piel sensible.', lactancia:'precaucion', afecciones_relevantes:['dermatitis'] },
  'ANISE ALCOHOL': { nombre_com:'Alcohol de anís', categorias:['fragrance_ae'], severidad:'verde', nota:'Presente en aceite esencial de anís. Declarado en Anexo III UE. Aceptable en cosmética orgánica.', lactancia:'ok' },
  'BENZYL CINNAMATE': { nombre_com:'Cinamato de bencilo', categorias:['fragrance_ae'], severidad:'verde', nota:'Presente en bálsamo de Perú y bálsamo de tolú, ambos de origen natural. Declarado en Anexo III UE.', lactancia:'ok' },
  'EVERNIA FURFURACEA EXTRACT': { nombre_com:'Extracto de musgo de árbol', categorias:['fragrance_ae'], severidad:'verde', nota:'Extracto 100% natural de musgo arbóreo. Declarado en Anexo III UE por alto potencial alergénico a pesar de su origen natural. Usar con precaución en piel sensible o con historial de alergias.', lactancia:'ok' },
  'EVERNIA PRUNASTRI EXTRACT': { nombre_com:'Extracto de musgo de roble', categorias:['fragrance_ae'], severidad:'verde', nota:'Extracto 100% natural de musgo de roble. Uno de los alérgenos de fragancia más potentes incluso siendo natural. Declarado en Anexo III UE. Restricciones en endurecimiento en la UE.', lactancia:'ok', afecciones_relevantes:['dermatitis'] },

  // Sintéticos (siempre amarillo — no aceptados en cosmética natural)
  'HEXYL CINNAMAL': { nombre_com:'Hexil cinamal', categorias:['fragrance_sintetica'], severidad:'amarillo', nota:'Compuesto aromático de síntesis. Aroma tipo jazmín. Declarado en Anexo III UE. No aceptado en cosmética natural.', lactancia:'ok' },
  'HYDROXYCITRONELLAL': { nombre_com:'Hidroxicitronelal', categorias:['fragrance_sintetica'], severidad:'amarillo', nota:'Fragancia sintética con aroma floral tipo lirio. Declarado en Anexo III UE. No aceptado en cosmética natural.', lactancia:'ok' },
  'ALPHA-ISOMETHYL IONONE': { nombre_com:'Alfa-isometil ionona', categorias:['fragrance_sintetica'], severidad:'amarillo', nota:'Fragancia sintética con aroma violeta/iris. Declarado en Anexo III UE. No aceptado en cosmética natural.', lactancia:'ok' },
  'AMYL CINNAMAL': { nombre_com:'Amil cinamal', categorias:['fragrance_sintetica'], severidad:'amarillo', nota:'Compuesto aromático de síntesis. Aroma tipo jazmín. Declarado en Anexo III UE. No aceptado en cosmética natural.', lactancia:'ok' },
  'AMYLCINNAMYL ALCOHOL': { nombre_com:'Alcohol amil-cinamílico', categorias:['fragrance_sintetica'], severidad:'amarillo', nota:'Compuesto aromático sintético. Declarado en Anexo III UE. No aceptado en cosmética natural.', lactancia:'ok' },
  'METHYL 2-OCTYNOATE': { nombre_com:'Metil 2-octinoato', categorias:['fragrance_sintetica'], severidad:'amarillo', nota:'Fragancia sintética con aroma violeta. Declarado en Anexo III UE. No aceptado en cosmética natural.', lactancia:'ok' },
  'BUTYLPHENYL METHYLPROPIONAL': { nombre_com:'Lilial / BMHCA', categorias:['fragrance_sintetica','disruptor_endocrino'], severidad:'rojo', nota:'PROHIBIDO en la UE desde enero 2022 (Reglamento 2021/1902). Disruptor endocrino confirmado. Si aparece en un producto en el mercado europeo, ese producto está fuera de la legalidad.', lactancia:'evitar' },
  'LILIAL': { alias:'BUTYLPHENYL METHYLPROPIONAL' },

  // ── DISRUPTORES ENDOCRINOS ────────────────────────────────────────────────
  'BUTYLPARABEN': { nombre_com:'Butilparabeno', categorias:['disruptor_endocrino','conservante_controvertido'], severidad:'rojo', nota:'Conservante con actividad estrogénica confirmada. Prohibido en la UE en productos para niños <3 años. Precaución máxima en embarazo y lactancia.', lactancia:'evitar' },
  'PROPYLPARABEN': { nombre_com:'Propilparabeno', categorias:['disruptor_endocrino','conservante_controvertido'], severidad:'rojo', nota:'Conservante con actividad estrogénica. Prohibido en productos para zona del pañal en la UE. Precaución en embarazo y lactancia.', lactancia:'evitar' },
  'ISOBUTYLPARABEN': { nombre_com:'Isobutilparabeno', categorias:['disruptor_endocrino','conservante_controvertido'], severidad:'rojo', nota:'Parabeno de cadena larga. Potencial disruptor endocrino. Prohibido en productos infantiles en la UE.', lactancia:'evitar' },
  'ISOPROPYLPARABEN': { nombre_com:'Isopropilparabeno', categorias:['disruptor_endocrino','conservante_controvertido'], severidad:'rojo', nota:'Parabeno de cadena larga. Potencial disruptor endocrino.', lactancia:'evitar' },
  'METHYLPARABEN': { nombre_com:'Metilparabeno', categorias:['conservante_controvertido'], severidad:'amarillo', nota:'El conservante más utilizado en cosmética. Menor preocupación endocrina que los parabenos de cadena larga (butyl/propyl). El debate científico sigue abierto.', lactancia:'precaucion' },
  'ETHYLPARABEN': { nombre_com:'Etilparabeno', categorias:['conservante_controvertido'], severidad:'amarillo', nota:'Parabeno de cadena corta. Menor actividad estrogénica que los de cadena larga. Aceptado en la UE con restricciones de concentración.', lactancia:'precaucion' },
  'BENZOPHENONE-3': { nombre_com:'Benzofenona-3 / Oxibenzona', categorias:['disruptor_endocrino'], severidad:'rojo', nota:'Filtro UV con actividad hormonal confirmada. Penetra la piel y se detecta en sangre y orina. Restricciones en la UE (≤6%). Prohibido en arrecifes de coral. Evitar en embarazo.', lactancia:'evitar' },
  'OXYBENZONE': { alias:'BENZOPHENONE-3' },
  'BENZOPHENONE-4': { nombre_com:'Benzofenona-4', categorias:['disruptor_endocrino'], severidad:'amarillo', nota:'Filtro UV. Menor preocupación endocrina que la BP-3 pero en la misma familia química. Precaución en embarazo.', lactancia:'precaucion' },
  'HOMOSALATE': { nombre_com:'Homosalato', categorias:['disruptor_endocrino'], severidad:'amarillo', nota:'Filtro UV orgánico. La SCCS europea redujo el límite permitido (≤7,34%) por preocupaciones endocrinas. Evitar en embarazo y lactancia.', lactancia:'evitar' },
  'ETHYLHEXYL METHOXYCINNAMATE': { nombre_com:'Octinoxato', categorias:['disruptor_endocrino'], severidad:'amarillo', nota:'Filtro UV muy usado. Actividad hormonal débil pero documentada. Penetra la piel. Prohibido en zonas de arrecife en Hawái y Palau. Precaución en embarazo.', lactancia:'precaucion' },
  'OCTINOXATE': { alias:'ETHYLHEXYL METHOXYCINNAMATE' },
  'TRICLOSAN': { nombre_com:'Triclosán', categorias:['disruptor_endocrino','conservante_controvertido'], severidad:'rojo', nota:'Antibacteriano con actividad hormonal confirmada. Genera resistencia bacteriana. Prohibido en productos de enjuague en la UE. A evitar en productos leave-on.', lactancia:'evitar' },
  'BHA': { nombre_com:'BHA (Butilhidroxianisol)', categorias:['disruptor_endocrino'], severidad:'rojo', nota:'Antioxidante sintético. Clasificado como posible carcinógeno (Grupo 2B, IARC) y disruptor endocrino. Uso restringido en la UE en cosmética.', lactancia:'evitar' },
  'BUTYLHYDROXYANISOLE': { alias:'BHA' },
  'BHT': { nombre_com:'BHT (Butilhidroxitolueno)', categorias:['disruptor_endocrino'], severidad:'amarillo', nota:'Antioxidante sintético. Preocupaciones menores que el BHA pero en debate científico. Posible actividad hormonal débil.', lactancia:'precaucion' },
  'BUTYLHYDROXYTOLUENE': { alias:'BHT' },
  'OCTOCRYLENE': { nombre_com:'Octocrileno', categorias:['disruptor_endocrino'], severidad:'amarillo', nota:'Filtro UV que se degrada en benzofenona con el tiempo — especialmente preocupante en productos caducados o abiertos hace mucho. Investigado como disruptor endocrino.', lactancia:'precaucion' },
  'OCTOCRILENE': { alias:'OCTOCRYLENE' },
  '4-METHYLBENZYLIDENE CAMPHOR': { nombre_com:'4-MBC', categorias:['disruptor_endocrino'], severidad:'rojo', nota:'Filtro UV con actividad tiroidea y estrogénica confirmada en estudios animales. Prohibido en Canadá. Evitar en embarazo.', lactancia:'evitar' },

  // ── ALCOHOLES DESECANTES ──────────────────────────────────────────────────
  'ALCOHOL DENAT.': { nombre_com:'Alcohol desnaturalizado', categorias:['alcohol_desecante','irritante'], severidad:'amarillo', nota:'Alcohol etílico desnaturalizado. Da sensación de frescor inmediato pero compromete la función barrera con el uso continuado. Especialmente problemático en piel seca, sensible o con rosácea.', lactancia:'ok', afecciones_relevantes:['rosácea','piel_sensible','piel_seca','dermatitis'] },
  'ALCOHOL DENAT': { alias:'ALCOHOL DENAT.' },
  'SD ALCOHOL': { alias:'ALCOHOL DENAT.' },
  'SD ALCOHOL 40-B': { alias:'ALCOHOL DENAT.' },
  'DENATURED ALCOHOL': { alias:'ALCOHOL DENAT.' },
  'ISOPROPYL ALCOHOL': { nombre_com:'Alcohol isopropílico', categorias:['alcohol_desecante','irritante'], severidad:'amarillo', nota:'Más agresivo que el etanol. Desengrasante intenso, compromete la barrera cutánea. No usar habitualmente en el rostro.', lactancia:'ok', afecciones_relevantes:['rosácea','piel_sensible','piel_seca'] },
  'ETHANOL': { nombre_com:'Etanol (en alta concentración)', categorias:['alcohol_desecante'], severidad:'amarillo', nota:'Cuando aparece en los primeros 5 puestos del INCI puede resecar la piel. En posiciones bajas, el impacto es mínimo. Contexto importante.', lactancia:'ok' },

  // ── DERIVADOS DEL PETRÓLEO ────────────────────────────────────────────────
  'MINERAL OIL': { nombre_com:'Aceite mineral', categorias:['derivado_petroleo'], severidad:'amarillo', nota:'Derivado del petróleo refinado. Oclusivo potente — sella la piel sin nutrirla. No es peligroso por sí solo, pero incompatible con el enfoque de cosmética natural. La calidad del refinado determina su seguridad.', lactancia:'ok' },
  'PARAFFINUM LIQUIDUM': { alias:'MINERAL OIL' },
  'PETROLATUM': { nombre_com:'Vaselina / Petrolatum', categorias:['derivado_petroleo'], severidad:'amarillo', nota:'Derivado del petróleo. Excelente oclusivo y cicatrizante pero de origen petroquímico. En cosmética natural se sustituye por mantecas vegetales. La calidad del refinado es clave.', lactancia:'ok' },
  'PETROLEUM JELLY': { alias:'PETROLATUM' },
  'PARAFFIN': { nombre_com:'Parafina', categorias:['derivado_petroleo'], severidad:'amarillo', nota:'Cera derivada del petróleo. Espesante y oclusivo de origen petroquímico.', lactancia:'ok' },
  'CERESIN': { nombre_com:'Ceresina', categorias:['derivado_petroleo'], severidad:'amarillo', nota:'Cera purificada de ozoquerita (mineral/petróleo). Usada como espesante en labiales y pomadas.', lactancia:'ok' },
  'MICROCRYSTALLINE WAX': { nombre_com:'Cera microcristalina', categorias:['derivado_petroleo'], severidad:'amarillo', nota:'Cera derivada del petróleo. Textura más suave que la parafina. Muy común en labiales y bálsamos.', lactancia:'ok' },
  'OZOKERITE': { nombre_com:'Ozoquerita', categorias:['derivado_petroleo'], severidad:'amarillo', nota:'Cera mineral de origen petroquímico. Base de la ceresina.', lactancia:'ok' },
  'ISOHEXADECANE': { nombre_com:'Isohexadecano', categorias:['derivado_petroleo'], severidad:'amarillo', nota:'Emoliente sintético petroquímico. Da textura ligera. Muy usado en bases de maquillaje.', lactancia:'ok' },
  'ISODODECANE': { nombre_com:'Isododecano', categorias:['derivado_petroleo'], severidad:'amarillo', nota:'Solvente petroquímico volátil. Sensación de ligereza. Muy común en maquillaje de larga duración.', lactancia:'ok' },
  'ISOEICOSANE': { nombre_com:'Isoeicosano', categorias:['derivado_petroleo'], severidad:'amarillo', nota:'Emoliente de origen petroquímico. Proporciona textura sedosa.', lactancia:'ok' },

  // ── SILICONAS ─────────────────────────────────────────────────────────────
  'DIMETHICONE': { nombre_com:'Dimeticona', categorias:['silicona'], severidad:'amarillo', comedogenico:1, nota:'Silicona muy extendida. Emoliente, suavizante, protectora. No biodegradable. En cosmética natural se reemplaza por aceites vegetales. Puede acumularse en el cabello dificultando la hidratación real a largo plazo.', lactancia:'ok' },
  'DIMETHICONOL': { nombre_com:'Dimeticonol', categorias:['silicona'], severidad:'amarillo', nota:'Silicona similar a la dimeticona. Muy común en acondicionadores y sérums de cabello.', lactancia:'ok' },
  'CYCLOPENTASILOXANE': { nombre_com:'Ciclopentasiloxano (D5)', categorias:['silicona','disruptor_endocrino'], severidad:'rojo', nota:'Silicona volátil RESTRINGIDA en la UE desde 2020 en productos de enjuague (≤0,1%) por persistencia medioambiental y posible actividad hormonal. Comprueba si el producto es rinse-off o leave-on.', lactancia:'precaucion' },
  'CYCLOHEXASILOXANE': { nombre_com:'Ciclohexasiloxano (D6)', categorias:['silicona'], severidad:'amarillo', nota:'Silicona volátil sujeta a seguimiento medioambiental en la UE por su persistencia.', lactancia:'ok' },
  'CYCLOTETRASILOXANE': { nombre_com:'Ciclotetrasiloxano (D4)', categorias:['silicona','disruptor_endocrino'], severidad:'rojo', nota:'Silicona volátil clasificada como SVHC (sustancia extremadamente preocupante) en la UE. Restricciones estrictas en productos de enjuague. Evitar.', lactancia:'evitar' },
  'PHENYL TRIMETHICONE': { nombre_com:'Fenil trimeticona', categorias:['silicona'], severidad:'amarillo', nota:'Silicona que aporta brillo y suavidad. Común en cuidado del cabello. No biodegradable.', lactancia:'ok' },
  'AMODIMETHICONE': { nombre_com:'Amodimeticona', categorias:['silicona'], severidad:'amarillo', nota:'Silicona aminomodificada. Especialmente acumulativa en el cabello con el uso continuado. Dificulta la penetración de activos hidratantes reales.', lactancia:'ok' },
  'TRIMETHYLSILOXYSILI CATE': { nombre_com:'Trimetilsiloxi silicato', categorias:['silicona'], severidad:'amarillo', nota:'Silicona de larga duración. Muy usada en maquillaje resistente al agua.', lactancia:'ok' },

  // ── CONSERVANTES CONTROVERTIDOS ───────────────────────────────────────────
  'METHYLISOTHIAZOLINONE': { nombre_com:'Metilisotiazolinona (MI)', categorias:['conservante_controvertido','irritante'], severidad:'rojo', nota:'Sensibilizante potente. PROHIBIDO en productos leave-on en la UE desde 2017. Alérgeno del año 2013. Frecuente causa de dermatitis de contacto — incluso en concentraciones muy bajas.', lactancia:'evitar', afecciones_relevantes:['dermatitis','piel_sensible','rosácea'] },
  'METHYLCHLOROISOTHIAZOLINONE': { nombre_com:'Metilcloroisotiazolinona (MCI)', categorias:['conservante_controvertido','irritante'], severidad:'rojo', nota:'Sensibilizante potente. En combinación con MI forma el Kathon CG. Solo permitido en productos de enjuague en la UE y a concentraciones muy bajas.', lactancia:'evitar', afecciones_relevantes:['dermatitis','piel_sensible'] },
  'DMDM HYDANTOIN': { nombre_com:'DMDM Hidantoína', categorias:['conservante_controvertido','formaldehido_liberador'], severidad:'rojo', nota:'Conservante que libera formaldehído gradualmente. El formaldehído es carcinógeno Grupo 1 (IARC). Asociado a dermatitis de contacto alérgica.', lactancia:'evitar' },
  'IMIDAZOLIDINYL UREA': { nombre_com:'Imidazolidinil urea', categorias:['conservante_controvertido','formaldehido_liberador'], severidad:'rojo', nota:'Conservante liberador de formaldehído. El más usado de esta familia. Dermatitis de contacto frecuente.', lactancia:'evitar' },
  'DIAZOLIDINYL UREA': { nombre_com:'Diazolidinyl urea', categorias:['conservante_controvertido','formaldehido_liberador'], severidad:'rojo', nota:'Conservante liberador de formaldehído. Más potente que el imidazolidinyl urea. Precaución en todos los tipos de piel.', lactancia:'evitar' },
  'QUATERNIUM-15': { nombre_com:'Quaternium-15', categorias:['conservante_controvertido','formaldehido_liberador'], severidad:'rojo', nota:'El conservante liberador de formaldehído más potente. Prohibido en Japón. Frecuente en cosméticos de bajo coste.', lactancia:'evitar' },
  '2-BROMO-2-NITROPROPANE-1,3-DIOL': { nombre_com:'Bronopol', categorias:['conservante_controvertido','formaldehido_liberador'], severidad:'rojo', nota:'Conservante liberador de formaldehído. Puede formar nitrosaminas (potencialmente carcinógenas) con aminas.', lactancia:'evitar' },
  'BRONOPOL': { alias:'2-BROMO-2-NITROPROPANE-1,3-DIOL' },
  'SODIUM HYDROXYMETHYLGLYCINATE': { nombre_com:'Hidroximetilglicinato de sodio', categorias:['conservante_controvertido','formaldehido_liberador'], severidad:'amarillo', nota:'Conservante de base aminoácida que libera formaldehído. Presente en algunos productos que se anuncian como "naturales". Verificar siempre.', lactancia:'precaucion' },
  'PHENOXYETHANOL': { nombre_com:'Fenoxietanol', categorias:['no_cosmetica_natural','conservante_controvertido'], severidad:'amarillo', nota:'Conservante sintético muy habitual en cosmética convencional y en muchos productos que se venden como "naturales". La ANSM francesa advirtió de riesgo en menores de 3 años (zona del pañal). No aceptado en cosmética certificada COSMOS Organic (sí en COSMOS Natural con límites). Debate científico activo; bien tolerado en general a concentraciones ≤1% (límite UE). Indica que el producto no es cosmética orgánica certificada.', lactancia:'precaucion', afecciones_relevantes:['piel_sensible'] },
  'CHLORPHENESIN': { nombre_com:'Clorfenesina', categorias:['conservante_controvertido'], severidad:'amarillo', nota:'Conservante frecuentemente combinado con fenoxietanol. Escasos estudios de seguridad a largo plazo.', lactancia:'precaucion' },
  'CHLOROACETAMIDE': { nombre_com:'Cloroacetamida', categorias:['conservante_controvertido','irritante'], severidad:'rojo', nota:'Conservante sensibilizante potente. Prohibido en algunos países. Causa frecuente de dermatitis de contacto.', lactancia:'evitar' },

  // ── SULFATOS E IRRITANTES FUERTES ─────────────────────────────────────────
  'SODIUM LAURYL SULFATE': { nombre_com:'SLS (Laurilsulfato de sodio)', categorias:['sulfato','irritante','comedogenico'], severidad:'rojo', comedogenico:5, nota:'Tensioactivo muy agresivo. Referencia estándar para medir irritación en tests de seguridad. Destruye la barrera cutánea con uso continuado. Comedogenicidad 5/5. Evitar en piel sensible, seca, con rosácea o acné.', lactancia:'ok', afecciones_relevantes:['rosácea','piel_sensible','dermatitis','acne','piel_seca'] },
  'SODIUM LAURETH SULFATE': { nombre_com:'SLES (Laureth sulfato de sodio)', categorias:['sulfato','irritante'], severidad:'amarillo', comedogenico:2, nota:'Versión más suave del SLS. Aún tensioactivo fuerte. Puede contener 1,4-dioxano como contaminante del proceso de etoxilación.', lactancia:'ok', afecciones_relevantes:['rosácea','piel_sensible','dermatitis'] },
  'AMMONIUM LAURYL SULFATE': { nombre_com:'Laurilsulfato de amonio', categorias:['sulfato','irritante'], severidad:'amarillo', nota:'Similar al SLS con base amónica. Igualmente agresivo para la función barrera.', lactancia:'ok', afecciones_relevantes:['piel_sensible','rosácea'] },

  // ── COMEDOGÉNICOS DESTACADOS ──────────────────────────────────────────────
  'ISOPROPYL MYRISTATE': { nombre_com:'Miristato de isopropilo', categorias:['comedogenico'], severidad:'amarillo', comedogenico:5, nota:'Emoliente sintético con comedogenicidad 5/5. Muy común en cremas y bases de maquillaje. Evitar en piel acneica o con poros congestionados.', lactancia:'ok', afecciones_relevantes:['acne'] },
  'ISOPROPYL PALMITATE': { nombre_com:'Palmitato de isopropilo', categorias:['comedogenico'], severidad:'amarillo', comedogenico:4, nota:'Emoliente con comedogenicidad 4/5. Precaución en pieles acneicas.', lactancia:'ok', afecciones_relevantes:['acne'] },
  'MYRISTYL MYRISTATE': { nombre_com:'Miristato de miristilo', categorias:['comedogenico'], severidad:'amarillo', comedogenico:5, nota:'Comedogenicidad 5/5. Evitar en piel acneica.', lactancia:'ok', afecciones_relevantes:['acne'] },
  'COCOS NUCIFERA OIL': { nombre_com:'Aceite de coco', categorias:['comedogenico'], severidad:'amarillo', comedogenico:4, nota:'Aceite vegetal 100% natural, rico en ácido láurico, con propiedades emolientes y antimicrobianas. Comedogenicidad alta (4/5) — precaución especial en piel acneica o con poros congestionados; mejor sustituir por jojoba o rosa mosqueta en esas clientas. Excelente para cuerpo, cabello y manos.', lactancia:'ok', afecciones_relevantes:['acne','poros'] },
  'COCONUT OIL': { alias:'COCOS NUCIFERA OIL' },
  'COCOA BUTTER': { alias:'THEOBROMA CACAO SEED BUTTER' },
  'WHEAT GERM OIL': { nombre_com:'Aceite de germen de trigo', categorias:['comedogenico'], severidad:'amarillo', comedogenico:5, nota:'Muy rico en vitamina E pero comedogenicidad 5/5. Mejor usar solo en el cuerpo si la clienta tiene piel acneica.', lactancia:'ok', afecciones_relevantes:['acne'] },
  'TRITICUM VULGARE GERM OIL': { alias:'WHEAT GERM OIL' },
  'LINSEED OIL': { nombre_com:'Aceite de linaza', categorias:['comedogenico'], severidad:'amarillo', comedogenico:4, nota:'Rico en Omega-3 pero con comedogenicidad 4/5 por su alto contenido en ácido alfa-linolénico. Mejor para cuerpo que para rostro acneico.', lactancia:'ok', afecciones_relevantes:['acne'] },
  'LINUM USITATISSIMUM SEED OIL': { alias:'LINSEED OIL' },
  'ACETYLATED LANOLIN': { nombre_com:'Lanolina acetilada', categorias:['comedogenico'], severidad:'amarillo', comedogenico:5, nota:'Derivado de la lanolina con comedogenicidad 5/5. La lanolina sin modificar tiene menor puntuación.', lactancia:'ok', afecciones_relevantes:['acne'] },

  // ── IRRITANTES ESPECÍFICOS ────────────────────────────────────────────────
  'MENTHOL': { nombre_com:'Mentol', categorias:['irritante'], severidad:'amarillo', nota:'Sensación de frescor intensa por vasodilatación. En piel con rosácea puede desencadenar brotes. Irritante en mucosas y piel muy sensible.', lactancia:'precaucion', afecciones_relevantes:['rosácea','piel_sensible'] },
  'MENTHA PIPERITA OIL': { nombre_com:'Aceite esencial de menta piperita', categorias:['irritante','fragrance_ae'], severidad:'amarillo', nota:'Contiene mentol y mentona. Vasodilatador. Posible desencadenante en rosácea. Contraindicado en bebés y niños <2 años (riesgo apnea). Precaución en embarazo.', lactancia:'evitar', afecciones_relevantes:['rosácea','piel_sensible'] },
  'EUCALYPTUS GLOBULUS LEAF OIL': { nombre_com:'Aceite esencial de eucalipto', categorias:['irritante'], severidad:'amarillo', nota:'Potente, puede irritar mucosas y piel sensible. No usar en niños. Precaución en embarazo.', lactancia:'evitar', afecciones_relevantes:['rosácea','piel_sensible'] },
  'CITRUS LIMON PEEL OIL': { nombre_com:'Aceite esencial de limón', categorias:['irritante','fragrance_ae'], severidad:'amarillo', nota:'Fotosensibilizante (contiene furocumarinas). No aplicar en zonas expuestas al sol. Puede irritar piel sensible.', lactancia:'ok', afecciones_relevantes:['piel_sensible'] },
  'CITRUS AURANTIUM DULCIS PEEL OIL': { nombre_com:'Aceite esencial de naranja', categorias:['irritante','fragrance_ae'], severidad:'amarillo', nota:'Fotosensibilizante. Precaución en productos que se aplican de día sin aclarado.', lactancia:'ok', afecciones_relevantes:['piel_sensible'] },
  'RETINOL': { nombre_com:'Retinol (vitamina A)', categorias:['irritante'], severidad:'amarillo', nota:'Activo potente. Puede causar purga, fotosensibilidad y sequedad. CONTRAINDICADO en embarazo (teratógeno). Solo uso nocturno con protección solar estricta de día. Iniciar con concentraciones bajas.', lactancia:'evitar', afecciones_relevantes:['piel_sensible','rosácea'] },
  'RETINYL PALMITATE': { nombre_com:'Palmitato de retinilo', categorias:['irritante'], severidad:'amarillo', nota:'Forma más suave del retinol (ester). Menos irritante pero también contraindicado en embarazo. Fotosensibilizante.', lactancia:'evitar' },
  'SALICYLIC ACID': { nombre_com:'Ácido salicílico (BHA)', categorias:['irritante'], severidad:'amarillo', nota:'BHA exfoliante. Muy eficaz en piel acneica. Puede irritar en piel sensible o seca. Contraindicado en embarazo a altas concentraciones. Fotosensibilizante.', lactancia:'precaucion', afecciones_relevantes:['piel_sensible','piel_seca'] },
  'GLYCOLIC ACID': { nombre_com:'Ácido glicólico (AHA)', categorias:['irritante'], severidad:'amarillo', nota:'AHA exfoliante potente. Puede irritar en piel sensible, rosácea o barrera comprometida. Fotosensibilizante — usar siempre con SPF durante el día.', lactancia:'precaucion', afecciones_relevantes:['piel_sensible','rosácea'] },
  'LACTIC ACID': { nombre_com:'Ácido láctico (AHA)', categorias:['irritante'], severidad:'amarillo', nota:'AHA más suave que el glicólico. Generalmente bien tolerado pero fotosensibilizante. Precaución en piel muy sensible.', lactancia:'ok', afecciones_relevantes:['piel_sensible'] },

  // ── PETROQUÍMICOS / PEG / POLÍMEROS ──────────────────────────────────────
  'PROPYLENE GLYCOL': { nombre_com:'Propilenglicol', categorias:['petroquimico','irritante'], severidad:'amarillo', nota:'Humectante de origen petroquímico. Generalmente seguro pero puede irritar en piel sensible con barrera comprometida. A alta concentración, sensibilizante.', lactancia:'ok', afecciones_relevantes:['piel_sensible','dermatitis'] },
  'BUTYLENE GLYCOL': { nombre_com:'Butilenglicol', categorias:['petroquimico'], severidad:'amarillo', nota:'Humectante y solvente de síntesis petroquímica. Menor potencial irritante que el propilenglicol.', lactancia:'ok' },
  'CARBOMER': { nombre_com:'Carbomer', categorias:['petroquimico'], severidad:'amarillo', nota:'Polímero acrílico de síntesis petroquímica. Espesante muy habitual. Generalmente bien tolerado.', lactancia:'ok' },
  'ACRYLATES COPOLYMER': { nombre_com:'Copolímero de acrilatos', categorias:['petroquimico'], severidad:'amarillo', nota:'Polímero sintético (posible microplástico). Usado como fijador y formador de película. Bajo seguimiento regulatorio europeo.', lactancia:'ok' },
  'POLYETHYLENE': { nombre_com:'Polietileno', categorias:['petroquimico'], severidad:'rojo', nota:'Microplástico. En exfoliantes físicos PROHIBIDO en la UE. En otros formatos, bajo revisión regulatoria activa.', lactancia:'ok' },
  'NYLON-12': { nombre_com:'Nylon-12', categorias:['petroquimico'], severidad:'amarillo', nota:'Polímero sintético (microplástico potencial). Común en sombras y polvos. Bajo seguimiento medioambiental.', lactancia:'ok' },

  // ── NO ACEPTADOS EN COSMÉTICA NATURAL (seguros pero sintéticos) ───────────
  'DISODIUM EDTA': { nombre_com:'Disodio EDTA', categorias:['no_cosmetica_natural','petroquimico'], severidad:'amarillo', nota:'Quelante sintético. Estabiliza fórmulas y potencia conservantes. Seguro toxicológicamente pero no aceptado en cosmética natural certificada.', lactancia:'ok' },
  'TETRASODIUM EDTA': { nombre_com:'Tetrasodio EDTA', categorias:['no_cosmetica_natural','petroquimico'], severidad:'amarillo', nota:'Quelante sintético. Igual función que el disodio EDTA. No aceptado en cosmética natural.', lactancia:'ok' },
  'TRISODIUM EDTA': { nombre_com:'Trisodio EDTA', categorias:['no_cosmetica_natural','petroquimico'], severidad:'amarillo', nota:'Quelante sintético. No aceptado en cosmética natural.', lactancia:'ok' },
  'POLYSORBATE 20': { nombre_com:'Polisorbato 20', categorias:['no_cosmetica_natural','petroquimico'], severidad:'amarillo', nota:'Emulsionante sintético derivado del sorbitol y óxido de etileno (proceso de etoxilación). Puede contener 1,4-dioxano como contaminante. No aceptado en cosmética natural certificada.', lactancia:'ok' },
  'POLYSORBATE 60': { nombre_com:'Polisorbato 60', categorias:['no_cosmetica_natural','petroquimico'], severidad:'amarillo', nota:'Emulsionante sintético etoxilado. No aceptado en cosmética natural certificada. Puede contener 1,4-dioxano.', lactancia:'ok' },
  'POLYSORBATE 80': { nombre_com:'Polisorbato 80', categorias:['no_cosmetica_natural','petroquimico'], severidad:'amarillo', nota:'Emulsionante sintético etoxilado muy extendido. No aceptado en cosmética natural certificada.', lactancia:'ok' },
  'COCAMIDOPROPYL BETAINE': { nombre_com:'Cocamidopropil betaína', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Tensioactivo semisintético derivado del coco pero modificado químicamente. Frecuente sensibilizante (impurezas del proceso). No aceptado en cosmética natural estricta aunque sí en algunas certificaciones "bio".', lactancia:'ok', afecciones_relevantes:['dermatitis','piel_sensible'] },
  'SODIUM COCOAMPHOACETATE': { nombre_com:'Cocoamfoacetato de sodio', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Tensioactivo anfótero semisintético. Suave pero de síntesis química. Aceptado en algunas certificaciones naturales, rechazado en otras.', lactancia:'ok' },
  'STEARETH-2': { nombre_com:'Steareth-2', categorias:['no_cosmetica_natural','petroquimico'], severidad:'amarillo', nota:'Emulsionante sintético etoxilado. No aceptado en cosmética natural. Puede contener 1,4-dioxano.', lactancia:'ok' },
  'STEARETH-21': { nombre_com:'Steareth-21', categorias:['no_cosmetica_natural','petroquimico'], severidad:'amarillo', nota:'Emulsionante sintético etoxilado. No aceptado en cosmética natural.', lactancia:'ok' },
  'CETEARETH-20': { nombre_com:'Ceteareth-20', categorias:['no_cosmetica_natural','petroquimico'], severidad:'amarillo', nota:'Emulsionante sintético etoxilado. No aceptado en cosmética natural certificada.', lactancia:'ok' },
  'LAURETH-4': { nombre_com:'Laureth-4', categorias:['no_cosmetica_natural','petroquimico'], severidad:'amarillo', nota:'Tensioactivo sintético etoxilado. No aceptado en cosmética natural.', lactancia:'ok' },
  'LAURETH-7': { alias:'LAURETH-4' },
  'ETHYLHEXYL PALMITATE': { nombre_com:'Palmitato de etilhexilo', categorias:['no_cosmetica_natural'], severidad:'amarillo', comedogenico:2, nota:'Emoliente sintético (ester). Sensación ligera. No aceptado en cosmética natural estricta aunque de perfil toxicológico bajo.', lactancia:'ok' },
  'ISONONYL ISONONANOATE': { nombre_com:'Isononanoato de isononilo', categorias:['no_cosmetica_natural','derivado_petroleo'], severidad:'amarillo', nota:'Emoliente sintético. No aceptado en cosmética natural.', lactancia:'ok' },
  'SODIUM SACCHARIN': { nombre_com:'Sacarina sódica', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Edulcorante sintético usado en productos bucales. No aceptado en cosmética natural.', lactancia:'ok' },
  'TITANIUM DIOXIDE': { nombre_com:'Dióxido de titanio (CI 77891)', categorias:[], severidad:'verde', nota:'Filtro UV mineral de amplio espectro. Aceptado en cosmética natural y orgánica certificada (COSMOS) en grado no-nano. Las nanopartículas están bajo restricciones en la UE por riesgo inhalatorio — verificar si el producto indica "non-nano". Habitual en protectores solares naturales.', lactancia:'ok' },
  'CI 77891': { alias:'TITANIUM DIOXIDE' },

  // ── ACEITES VEGETALES ─────────────────────────────────────────────────────
  'AQUA': { nombre_com:'Agua', categorias:[], severidad:'verde', nota:'Base acuosa de la fórmula. Sin restricciones.', lactancia:'ok' },
  'WATER': { alias:'AQUA' },

  'HELIANTHUS ANNUUS SEED OIL': { nombre_com:'Aceite de girasol', categorias:[], severidad:'verde', comedogenico:0, nota:'Aceite vegetal rico en ácido linoleico (omega-6). Emoliente ligero, bien tolerado por la mayoría de tipos de piel incluyendo pieles grasas. Habitual como base en cosmética orgánica. Presencia frecuente en fórmulas certificadas.', lactancia:'ok' },

  'ARGANIA SPINOSA KERNEL OIL': { nombre_com:'Aceite de argán', categorias:[], severidad:'verde', comedogenico:0, nota:'Aceite seco rico en ácidos grasos insaturados (oleico, linoleico) y vitamina E. Baja comedogenicidad (0/5). Excelente para todo tipo de pieles incluyendo grasa. Activo antiedad y reparador de la barrera. Ingrediente estrella de cosmética natural.', lactancia:'ok' },
  'SIMMONDSIA CHINENSIS SEED OIL': { nombre_com:'Aceite de jojoba', categorias:[], severidad:'verde', comedogenico:2, nota:'Técnicamente una cera líquida (no un aceite), muy similar al sebo humano. Comedogenicidad moderada-baja (2/5). Estabilizante de la barrera cutánea, regulador de la producción de sebo. Uno de los ingredientes más versátiles de la cosmética natural.', lactancia:'ok' },
  'ROSA CANINA FRUIT OIL': { nombre_com:'Aceite de rosa mosqueta', categorias:[], severidad:'verde', comedogenico:1, nota:'Aceite rico en ácidos grasos esenciales (linoleico, linolénico) y betacarotenos. Baja comedogenicidad (1/5). Activo regenerador y antiedad. Muy apreciado en cosmética natural para cicatrices, manchas y piel madura. Aroma característico.', lactancia:'ok' },
  'PRUNUS AMYGDALUS DULCIS OIL': { nombre_com:'Aceite de almendra dulce', categorias:[], severidad:'verde', comedogenico:2, nota:'Aceite emoliente suave, rico en ácido oleico. Comedogenicidad moderada-baja (2/5). Muy bien tolerado, ideal para pieles sensibles y bebés. Habitual como aceite de masaje y en cosméticos capilares.', lactancia:'ok' },
  'VITIS VINIFERA SEED OIL': { nombre_com:'Aceite de pepita de uva', categorias:[], severidad:'verde', comedogenico:1, nota:'Aceite ligero rico en ácido linoleico y proantocianidinas (OPC). Baja comedogenicidad (1/5). Antioxidante. Textura muy seca, ideal para pieles mixtas y grasas en cosmética natural.', lactancia:'ok' },
  'OLEA EUROPAEA FRUIT OIL': { nombre_com:'Aceite de oliva', categorias:[], severidad:'verde', comedogenico:2, nota:'Rico en ácido oleico y escualeno. Comedogenicidad moderada (2/5). Muy emoliente pero puede ser pesado en pieles grasas. Contiene oleocantal, un antiinflamatorio natural. Clásico de la cosmética mediterránea.', lactancia:'ok' },
  'PERSEA GRATISSIMA OIL': { nombre_com:'Aceite de aguacate', categorias:[], severidad:'verde', comedogenico:3, nota:'Rico en ácidos grasos insaturados (oleico) y vitaminas A, D y E. Comedogenicidad media (3/5) — monitorizar en pieles con tendencia al acné. Muy nutritivo para piel seca y madura. Textura rica.', lactancia:'ok', afecciones_relevantes:['acne'] },
  'RICINUS COMMUNIS SEED OIL': { nombre_com:'Aceite de ricino', categorias:[], severidad:'verde', comedogenico:1, nota:'Rico en ácido ricinoleico (90%), con propiedades emolientes y antiinflamatorias. Textura muy espesa. Habitual en bálsamos labiales, productos para cejas/pestañas y cosméticos capilares. Muy buen fijador natural.', lactancia:'ok' },
  'HIPPOPHAE RHAMNOIDES FRUIT OIL': { nombre_com:'Aceite de espino amarillo', categorias:[], severidad:'verde', comedogenico:1, nota:'Uno de los aceites más ricos en omega-7 (ácido palmitoleico). Excepcional para piel madura, seca y con daño solar. Coloración naranja intensa — se usa en pequeñas proporciones. Activo regenerador potente en cosmética natural.', lactancia:'ok' },
  'CALOPHYLLUM INOPHYLLUM SEED OIL': { nombre_com:'Aceite de tamanu', categorias:[], severidad:'verde', comedogenico:2, nota:'Aceite con propiedades cicatrizantes y antiinflamatorias bien documentadas. Comedogenicidad moderada (2/5). Habitual en cosmética natural para pieles con problemas dérmicos (cicatrices, eczema). Aroma intenso.', lactancia:'ok' },
  'CAMELLIA SINENSIS SEED OIL': { nombre_com:'Aceite de camelia', categorias:[], severidad:'verde', comedogenico:2, nota:'Rico en ácido oleico y polifenoles antioxidantes. Textura ligera y seca. Buen perfil para cosmética antiedad natural. Habitual en cosmética japonesa tradicional.', lactancia:'ok' },
  'CAPRYLIC/CAPRIC TRIGLYCERIDE': { nombre_com:'Triglicérido caprílico/cáprico', categorias:[], severidad:'verde', comedogenico:1, nota:'Fracción de cadena media del aceite de coco o palma, procesada para obtener un emoliente muy ligero y estable. Aceptado en cosmética natural. Textura no grasa, excelente sensorial. Bajo potencial comedogénico (1/5).', lactancia:'ok' },

  // ── MANTECAS ─────────────────────────────────────────────────────────────
  'BUTYROSPERMUM PARKII BUTTER': { nombre_com:'Manteca de karité (shea butter)', categorias:[], severidad:'verde', comedogenico:0, nota:'Manteca rica en ácidos grasos insaturados (oleico, esteárico) y fracción insaponificable activa (triterpenos, fitoesteroles). Baja comedogenicidad (0/5). Emoliente, calmante y nutritiva. Ingrediente estrella de cosmética natural para piel seca, sensible y bebés. Muy bien tolerada.', lactancia:'ok' },
  'THEOBROMA CACAO SEED BUTTER': { nombre_com:'Manteca de cacao', categorias:['comedogenico'], severidad:'amarillo', comedogenico:4, nota:'Manteca vegetal rica en ácidos grasos saturados (esteárico, palmítico, oleico). Muy emoliente y oclusiva. Comedogénica alta (4/5) — no recomendada para pieles con tendencia al acné ni poros congestionados, aunque sea un ingrediente 100% natural. Aroma característico a chocolate si no está desodorizada.', lactancia:'ok', afecciones_relevantes:['acne','poros'] },
  'MANGIFERA INDICA SEED BUTTER': { nombre_com:'Manteca de mango', categorias:[], severidad:'verde', comedogenico:2, nota:'Manteca de semilla de mango. Textura más seca y ligera que karité o cacao. Comedogenicidad moderada-baja (2/5). Rica en ácido esteárico y oleico. Buena opción para pieles normales a mixtas en cosmética natural.', lactancia:'ok' },

  // ── CERAS ─────────────────────────────────────────────────────────────────
  'CERA ALBA': { nombre_com:'Cera de abeja (beeswax)', categorias:[], severidad:'verde', comedogenico:0, nota:'Cera natural de origen animal (abeja). Emulsionante y espesante en bálsamos, pomadas y cosméticos sólidos. Baja comedogenicidad (0/5). No apta para cosmética vegana. Forma una película protectora suave sobre la piel.', lactancia:'ok' },
  'BEESWAX': { alias:'CERA ALBA' },
  'COPERNICIA CERIFERA CERA': { nombre_com:'Cera de carnaúba', categorias:[], severidad:'verde', comedogenico:1, nota:'Cera vegetal de origen natural, alternativa vegana a la cera de abeja. Habitual en barras labiales, cosméticos sólidos y maquillaje natural.', lactancia:'ok' },
  'EUPHORBIA CERIFERA CERA': { nombre_com:'Cera de candelilla', categorias:[], severidad:'verde', comedogenico:1, nota:'Cera vegetal obtenida de un arbusto mexicano. Alternativa vegana a la cera de abeja, muy habitual en cosmética natural certificada. Buena textura y estabilidad.', lactancia:'ok' },

  // ── ACTIVOS NATURALES ─────────────────────────────────────────────────────
  'TOCOPHEROL': { nombre_com:'Tocoferol (vitamina E)', categorias:[], severidad:'verde', nota:'Vitamina E. Antioxidante natural que protege los aceites vegetales de la oxidación (lipoperoxidación) y actúa como activo sobre la piel: suavizante, reparador de la barrera y fotoprotector complementario. Muy habitual en cosmética natural como conservante natural + activo. Origen vegetal (germen de trigo, girasol).', lactancia:'ok' },
  'TOCOPHERYL ACETATE': { nombre_com:'Acetato de tocoferilo (vitamina E estabilizada)', categorias:[], severidad:'verde', nota:'Forma estabilizada de la vitamina E. Más estable que el tocoferol libre. Ampliamente aceptado en cosmética natural. Activo antioxidante y emoliente.', lactancia:'ok' },
  'ASCORBIC ACID': { nombre_com:'Ácido ascórbico (vitamina C)', categorias:[], severidad:'verde', nota:'Vitamina C. Antioxidante potente, estimulante de la síntesis de colágeno e iluminador. Muy inestable — se degrada con la luz, el calor y el oxígeno. Por eso suele usarse en formas derivadas más estables. Cuando se usa como ácido ascórbico puro, formatos anhydrous o en polvo son más eficaces.', lactancia:'ok' },
  'SODIUM ASCORBYL PHOSPHATE': { nombre_com:'Fosfato sódico de ascorbilo (vitamina C estable)', categorias:[], severidad:'verde', nota:'Derivado estable de la vitamina C con buena penetración cutánea. Ampliamente aceptado en cosmética natural. Menos irritante que el ácido ascórbico puro. Activo antioxidante e iluminador.', lactancia:'ok' },
  'PANTHENOL': { nombre_com:'Pantenol (pro-vitamina B5)', categorias:[], severidad:'verde', nota:'Pro-vitamina B5. En la piel se convierte en ácido pantoténico. Hidratante, calmante y reparador de la barrera cutánea. Habitual en cosmética natural para pieles sensibles e irritadas. Sin restricciones. Puede ser de origen vegetal (maíz) o sintético — ambas formas son idénticas funcionalmente.', lactancia:'ok' },
  'ALLANTOIN': { nombre_com:'Alantoína', categorias:[], severidad:'verde', nota:'Activo calmante, cicatrizante y queratolítico suave. Presente en consolda (Symphytum officinale) de forma natural, aunque la mayoría de cosmética usa síntesis química (idéntica a nivel molecular). Bien tolerado incluso en pieles muy sensibles.', lactancia:'ok' },
  'SODIUM HYALURONATE': { nombre_com:'Hialuronato sódico (ácido hialurónico)', categorias:[], severidad:'verde', nota:'Sal sódica del ácido hialurónico. Activo humectante que retiene hasta 1000 veces su peso en agua. Actualmente se obtiene por fermentación bacteriana (sin origen animal). Ampliamente aceptado en cosmética natural. Sin restricciones.', lactancia:'ok' },
  'HYALURONIC ACID': { alias:'SODIUM HYALURONATE' },
  'BAKUCHIOL': { nombre_com:'Bakuchiol', categorias:[], severidad:'verde', nota:'Activo botánico de la planta Psoralea corylifolia. Alternativa natural al retinol con propiedades similares (estimulante del colágeno, antiedad) pero sin su perfil de irritación. Aceptado en cosmética orgánica. Sin restricciones en embarazo ni lactancia — una de sus grandes ventajas frente al retinol.', lactancia:'ok' },

  // ── AGUAS E HIDROSOLES ────────────────────────────────────────────────────
  'ROSA DAMASCENA FLOWER WATER': { nombre_com:'Agua floral de rosa', categorias:[], severidad:'verde', nota:'Hidrosol de rosa damascena, subproducto de la destilación del aceite esencial. Calmante, ligeramente astringente y con aroma floral natural. Habitual en tónicos y brumas de cosmética natural.', lactancia:'ok' },
  'LAVANDULA ANGUSTIFOLIA FLOWER WATER': { nombre_com:'Agua floral de lavanda', categorias:[], severidad:'verde', nota:'Hidrosol de lavanda. Calmante, equilibrante y levemente antiséptico. Habitual en cosmética natural para pieles sensibles. Aroma suave a lavanda.', lactancia:'ok' },
  'ROSA CENTIFOLIA FLOWER WATER': { alias:'ROSA DAMASCENA FLOWER WATER' },

  // ── EXTRACTOS BOTÁNICOS ───────────────────────────────────────────────────
  'ALOE BARBADENSIS LEAF JUICE': { nombre_com:'Gel de aloe vera', categorias:[], severidad:'verde', nota:'Gel del interior de las hojas de aloe vera. Hidratante, calmante, antiinflamatorio y cicatrizante. Muy bien tolerado incluyendo pieles sensibles y reactivas. Habitual en cosmética natural. Sin restricciones.', lactancia:'ok' },
  'ALOE BARBADENSIS LEAF EXTRACT': { alias:'ALOE BARBADENSIS LEAF JUICE' },
  'ALOE VERA': { alias:'ALOE BARBADENSIS LEAF JUICE' },
  'CALENDULA OFFICINALIS FLOWER EXTRACT': { nombre_com:'Extracto de caléndula', categorias:[], severidad:'verde', nota:'Extracto botánico de caléndula. Cicatrizante, calmante y antiinflamatorio. Muy usado en cosmética natural para pieles sensibles, irritadas o con eczema. Sin restricciones.', lactancia:'ok' },
  'CHAMOMILLA RECUTITA FLOWER EXTRACT': { nombre_com:'Extracto de manzanilla', categorias:[], severidad:'verde', nota:'Rico en alfa-bisabolol y apigenina. Calmante, antiinflamatorio y levemente blanqueante. Habitual en cosmética natural para pieles sensibles y reactivas.', lactancia:'ok' },
  'MATRICARIA RECUTITA FLOWER EXTRACT': { alias:'CHAMOMILLA RECUTITA FLOWER EXTRACT' },
  'CAMELLIA SINENSIS LEAF EXTRACT': { nombre_com:'Extracto de té verde', categorias:[], severidad:'verde', nota:'Rico en catequinas (EGCG) y polifenoles antioxidantes. Protege la piel del daño oxidativo. Antiinflamatorio. Habitual en cosmética natural antiedad.', lactancia:'ok' },
  'CENTELLA ASIATICA EXTRACT': { nombre_com:'Extracto de centella asiática', categorias:[], severidad:'verde', nota:'Rico en asiaticósidos y madecasósidos. Estimula la síntesis de colágeno, repara la barrera cutánea y calma la piel. Muy apreciado en cosmética natural para piel sensible, rosácea y piel madura.', lactancia:'ok', afecciones_utiles:['rosácea','piel_sensible'] },
  'HIPPOPHAE RHAMNOIDES FRUIT EXTRACT': { nombre_com:'Extracto de espino amarillo', categorias:[], severidad:'verde', nota:'Rico en vitaminas C, E y omega-7. Antioxidante y regenerador. Habitual en cosmética natural para piel madura y dañada.', lactancia:'ok' },
  'ROSMARINUS OFFICINALIS LEAF EXTRACT': { nombre_com:'Extracto de romero', categorias:[], severidad:'verde', nota:'Antioxidante natural habitual en cosmética orgánica como conservante + activo. También se usa para estabilizar aceites vegetales. Contiene ácido carnósico y carnosol.', lactancia:'ok' },

  // ── EMULSIONANTES Y TEXTURIZANTES NATURALES ───────────────────────────────
  'GLYCERIN': { nombre_com:'Glicerina', categorias:[], severidad:'verde', nota:'Humectante natural por excelencia. Puede ser de origen vegetal (subproducto del biodiesel o jabonería) o sintético — en cosmética natural siempre se usa la vegetal. Atrae el agua del entorno hacia la piel. Sin restricciones.', lactancia:'ok' },
  'GLYCERINE': { alias:'GLYCERIN' },
  'CETYL ALCOHOL': { nombre_com:'Alcohol cetílico', categorias:[], severidad:'verde', nota:'Alcohol graso de cadena larga (C16), derivado de aceites vegetales (palma, coco). No es un alcohol desecante — es un emoliente y espesante. Habitual en cremas y lociones de cosmética natural. Diferente al etanol o isopropanol.', lactancia:'ok' },
  'CETEARYL ALCOHOL': { nombre_com:'Alcohol cetearílico', categorias:[], severidad:'verde', nota:'Mezcla de alcoholes grasos (cetílico + estearílico) de origen vegetal. Emoliente y espesante en emulsiones. No deseca. Ampliamente aceptado en cosmética natural y certificada.', lactancia:'ok' },
  'STEARIC ACID': { nombre_com:'Ácido esteárico', categorias:[], severidad:'verde', nota:'Ácido graso saturado de cadena larga, presente de forma natural en muchas grasas vegetales y animales. Texturizante y emoliente. Ampliamente aceptado en cosmética natural.', lactancia:'ok' },
  'OLEIC ACID': { nombre_com:'Ácido oleico', categorias:[], severidad:'verde', comedogenico:2, nota:'Ácido graso monoinsaturado, componente principal del aceite de oliva y argán. Muy emoliente. Comedogenicidad moderada (2/5). Natural y ampliamente aceptado en cosmética orgánica.', lactancia:'ok' },
  'LECITHIN': { nombre_com:'Lecitina', categorias:[], severidad:'verde', nota:'Fosfolípido emulsionante de origen natural (habitualmente soja o girasol). Fortalece la barrera cutánea y mejora la penetración de activos. Ampliamente aceptado en cosmética natural certificada.', lactancia:'ok' },
  'GLYCERYL STEARATE': { nombre_com:'Estearato de glicerilo', categorias:[], severidad:'verde', nota:'Emulsionante derivado de la reacción entre glicerina y ácido esteárico, ambos de origen vegetal. Aceptado en cosmética natural certificada (COSMOS). Suavizante y estabilizante de emulsiones.', lactancia:'ok' },
  'XANTHAN GUM': { nombre_com:'Goma xantana', categorias:[], severidad:'verde', nota:'Polisacárido obtenido por fermentación bacteriana (Xanthomonas campestris). Agente espesante y estabilizante. Ampliamente aceptado en cosmética natural y orgánica certificada.', lactancia:'ok' },

  // ── CONSERVANTES NATURALES Y DE BAJA CONTROVERSIA ────────────────────────
  'POTASSIUM SORBATE': { nombre_com:'Sorbato de potasio', categorias:[], severidad:'verde', nota:'Conservante de origen natural (ácido sórbico, presente en bayas del serbal). Muy habitual en cosmética natural certificada. Bajo perfil de irritación. Actúa sobre hongos y levaduras. Seguro en embarazo y lactancia.', lactancia:'ok' },
  'SODIUM BENZOATE': { nombre_com:'Benzoato de sodio', categorias:['conservante_controvertido'], severidad:'amarillo', nota:'Conservante derivado del ácido benzoico (presente en arándanos y canela). Aceptado en algunos estándares de cosmética natural pero no en cosmética orgánica certificada COSMOS. En combinación con vitamina C puede formar benzeno en muy bajas cantidades — sin riesgo demostrado a concentraciones cosméticas. Precaución en pieles reactivas.', lactancia:'ok', afecciones_relevantes:['piel_sensible'] },

  // ── PROPELENTES / GASES AEROSOL ──────────────────────────────────────────
  'BUTANE': { nombre_com:'Butano', categorias:['derivado_petroleo'], severidad:'amarillo', nota:'Gas propelente de origen petroquímico usado en desodorantes y sprays en aerosol. Inflamable. No queda en la piel — se evapora al salir del envase. Incompatible con cosmética natural certificada.', lactancia:'ok' },
  'ISOBUTANE': { nombre_com:'Isobutano', categorias:['derivado_petroleo'], severidad:'amarillo', nota:'Gas propelente petroquímico, variante del butano. Uso exclusivo en aerosoles. Mismo perfil que el butano — no queda en la piel.', lactancia:'ok' },
  'PROPANE': { nombre_com:'Propano', categorias:['derivado_petroleo'], severidad:'amarillo', nota:'Gas propelente petroquímico. Muy habitual junto al butano e isobutano en aerosoles de desodorante y laca. No queda en la piel.', lactancia:'ok' },

  // ── SALES DE ALUMINIO (ANTITRANSPIRANTES) ────────────────────────────────
  'ALUMINUM CHLOROHYDRATE': { nombre_com:'Clorohidrato de aluminio', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Activo antitranspirante más habitual en el mercado. Reduce la sudoración obstruyendo temporalmente los poros de las glándulas sudoríparas. Debate científico activo sobre su relación con el cáncer de mama y las alteraciones hormonales — la IARC no lo clasifica como carcinógeno. No aceptado en cosmética natural. Si hay preocupación, existen desodorantes naturales sin aluminio.', lactancia:'precaucion', afecciones_relevantes:['piel_sensible'] },
  'ALUMINUM SESQUICHLOROHYDRATE': { nombre_com:'Sesquiclorohidrato de aluminio', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Sal de aluminio antitranspirante, variante del clorohidrato. Mismo mecanismo de acción y mismo debate de seguridad. No aceptado en cosmética natural.', lactancia:'precaucion' },
  'ALUMINUM CHLORIDE': { nombre_com:'Cloruro de aluminio', categorias:['no_cosmetica_natural','irritante'], severidad:'rojo', nota:'Sal de aluminio con mayor concentración que el clorohidrato. Usada en antitranspirantes de prescripción para hiperhidrosis severa. Puede irritar la piel. No aceptado en cosmética natural.', lactancia:'evitar' },

  // ── EMOLIENTES SINTÉTICOS ────────────────────────────────────────────────
  'DICAPRYLYL ETHER': { nombre_com:'Éter dicaprilílico', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Emoliente muy ligero y volátil. Da sensación de sequedad y deslizamiento inmediato. Puede obtenerse de coco pero habitualmente es de síntesis. Frecuente en desodorantes spray y productos de tacto seco. No aceptado en cosmética natural certificada.', lactancia:'ok' },
  'OCTYLDODECANOL': { nombre_com:'Octildodecanol', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Alcohol graso de cadena larga emoliente. Da textura rica y aterciopelada. Puede ser de origen vegetal (coco, palma) pero generalmente sintético. No aceptado en cosmética natural certificada. Bajo perfil de seguridad.', lactancia:'ok' },
  'PROPYLENE CARBONATE': { nombre_com:'Carbonato de propileno', categorias:['petroquimico'], severidad:'amarillo', nota:'Disolvente y agente dispersante sintético. Se usa para disolver y estabilizar activos en fórmulas de desodorante y maquillaje. De origen petroquímico. No aceptado en cosmética natural.', lactancia:'ok' },

  // ── MINERALES / ARCILLAS SINTÉTICAS ─────────────────────────────────────
  'MAGNESIUM ALUMINUM SILICATE': { nombre_com:'Silicato de aluminio y magnesio', categorias:[], severidad:'verde', nota:'Arcilla mineral natural (variante esmectita). Espesante y estabilizante en suspensiones y emulsiones. Mejora la textura de productos en polvo y sprays. Sin restricciones de seguridad. Distinto del talco (magnesio silicato simple).', lactancia:'ok' },
  'DISTEARDIMONIUM HECTORITE': { nombre_com:'Hectorita de distearildimonio', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Arcilla hectorita modificada con un compuesto de amonio cuaternario. Espesante para fases oleosas y fórmulas anhydrous (sin agua). La modificación química la excluye de la cosmética natural certificada.', lactancia:'ok' },

  // ── ACTIVOS NATURALES ADICIONALES ────────────────────────────────────────
  'NIACINAMIDE': { nombre_com:'Niacinamida (vitamina B3)', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Activo sintético multifuncional (forma amida de la vitamina B3): regula el sebo, uniformiza el tono, refuerza la barrera, antiinflamatorio. Perfil de seguridad y tolerancia excelentes. No aceptado en cosmética orgánica certificada por ser de síntesis. Sin restricciones en embarazo ni lactancia.', lactancia:'ok' },
  'ADENOSINE': { nombre_com:'Adenosina', categorias:[], severidad:'verde', nota:'Nucleósido natural presente en todas las células vivas. Activo antiinflamatorio y antiedad. Estimula la síntesis de colágeno. Obtenida por fermentación. Aceptada en cosmética natural. Sin restricciones.', lactancia:'ok' },
  'AZELAIC ACID': { nombre_com:'Ácido azelaico', categorias:['irritante'], severidad:'amarillo', nota:'Ácido dicarboxílico presente de forma natural en el trigo, centeno y cebada. Antiinflamatorio, antibacteriano y antifúngico. Útil en acné, rosácea y manchas. Puede irritar en pieles muy sensibles al inicio. Sin restricciones en embarazo — uno de los pocos activos antimancha seguros en gestación.', lactancia:'ok', afecciones_relevantes:['piel_sensible'], afecciones_utiles:['acne','rosácea','manchas'] },
  'FERULIC ACID': { nombre_com:'Ácido ferúlico', categorias:[], severidad:'verde', nota:'Ácido fenólico antioxidante presente de forma natural en salvado de arroz, avena y manzana. Potencia y estabiliza la vitamina C y la vitamina E. Photoprotector complementario. Ampliamente aceptado en cosmética natural.', lactancia:'ok' },
  'RESVERATROL': { nombre_com:'Resveratrol', categorias:[], severidad:'verde', nota:'Polifenol antioxidante presente de forma natural en la piel de la uva, arándanos y frambuesas. Antiinflamatorio y activador de sirtuinas (genes de longevidad). Activo antiedad en cosmética natural. Sin restricciones.', lactancia:'ok' },
  'UBIQUINONE': { nombre_com:'Ubiquinona (Coenzima Q10)', categorias:[], severidad:'verde', nota:'Coenzima antioxidante presente de forma natural en el organismo. La usada en cosmética se obtiene por fermentación. Antiedad, protege la mitocondria celular. Ampliamente aceptado en cosmética natural. Sin restricciones.', lactancia:'ok' },
  'COENZYME Q10': { alias:'UBIQUINONE' },
  'ALPHA-ARBUTIN': { nombre_com:'Alfa-arbutina', categorias:[], severidad:'verde', nota:'Glucósido natural derivado de la planta Arctostaphylos uva-ursi (gayuba). Inhibidor de la tirosinasa — despigmentante eficaz y bien tolerado. Alternativa natural y más suave a la hidroquinona. Sin restricciones en embarazo.', lactancia:'ok' },
  'ARBUTIN': { alias:'ALPHA-ARBUTIN' },
  'KOJIC ACID': { nombre_com:'Ácido kójico', categorias:['irritante'], severidad:'amarillo', nota:'Ácido producido por fermentación fúngica (Aspergillus). Inhibidor de la tirosinasa, despigmentante eficaz. Puede causar irritación y sensibilización en pieles sensibles con uso prolongado. No recomendado en embarazo.', lactancia:'precaucion', afecciones_relevantes:['piel_sensible'] },
  'TRANEXAMIC ACID': { nombre_com:'Ácido tranexámico', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Derivado sintético del aminoácido lisina. Activo despigmentante de nueva generación, muy bien tolerado y eficaz. No apto en cosmética orgánica certificada. Sin restricciones de seguridad conocidas.', lactancia:'ok' },
  'SODIUM PCA': { nombre_com:'PCA de sodio (NMF)', categorias:[], severidad:'verde', nota:'Sal sódica del ácido pirrolidona carboxílico. "Factor Natural de Hidratación" (NMF) no es un ingrediente único: es el nombre que se da al conjunto de sustancias que la propia piel produce para retener agua (aminoácidos, urea, PCA, ácido láctico...) — el Sodium PCA es el componente que más se usa suelto como ingrediente cosmético bajo esa etiqueta. Humectante potente, capta y retiene agua en la capa córnea. Puede obtenerse de fuentes naturales por fermentación. Ampliamente aceptado en cosmética natural.', lactancia:'ok' },
  'ZINC GLUCONATE': { nombre_com:'Gluconato de zinc', categorias:[], severidad:'verde', nota:'Sal orgánica de zinc. Regulador del sebo y antibacteriano suave. Útil en cosmética para piel acneica y mixta. Sin restricciones.', lactancia:'ok', afecciones_utiles:['acne'] },
  'COPPER GLUCONATE': { nombre_com:'Gluconato de cobre', categorias:[], severidad:'verde', nota:'Sal orgánica de cobre. Estimula la síntesis de colágeno y tiene propiedades antimicrobianas. Activo antiedad a bajas concentraciones.', lactancia:'ok' },
  'ALPHA-BISABOLOL': { nombre_com:'Alfa-bisabolol', categorias:[], severidad:'verde', nota:'Sesquiterpeno natural presente en el aceite esencial de manzanilla alemana. Activo calmante, antiinflamatorio y promotor de la penetración de activos. Ampliamente usado en cosmética natural para pieles sensibles. Sin restricciones.', lactancia:'ok', afecciones_utiles:['rosácea','piel_sensible'] },
  'BISABOLOL': { alias:'ALPHA-BISABOLOL' },
  '(-)-ALPHA-BISABOLOL': { alias:'ALPHA-BISABOLOL' },
  'ACETYL GLUCOSAMINE': { nombre_com:'Acetilglucosamina', categorias:[], severidad:'verde', nota:'Azúcar amino natural. Exfoliante suave, inhibidor de la tirosinasa (despigmentante). Habitual en cosmética natural para manchas y textura irregular.', lactancia:'ok' },

  // ── ACEITES VEGETALES ADICIONALES ────────────────────────────────────────
  'OENOTHERA BIENNIS OIL': { nombre_com:'Aceite de onagra (primrose)', categorias:[], severidad:'verde', comedogenico:2, nota:'Aceite muy rico en GLA (ácido gamma-linolénico). Activo antiinflamatorio y reparador de la barrera cutánea. Especialmente beneficioso para piel seca, sensible y con eczema. Comedogenicidad moderada-baja (2/5).', lactancia:'ok', afecciones_utiles:['piel_sensible','dermatitis'] },
  'EVENING PRIMROSE OIL': { alias:'OENOTHERA BIENNIS OIL' },
  'BORAGO OFFICINALIS SEED OIL': { nombre_com:'Aceite de borraja', categorias:[], severidad:'verde', comedogenico:2, nota:'El aceite vegetal con mayor contenido en GLA (~24%). Antiinflamatorio potente y reparador de la barrera. Muy útil en piel seca, eccematosa y madura. Comedogenicidad moderada-baja (2/5). Usarlo en mezclas por su riqueza activa.', lactancia:'ok', afecciones_utiles:['piel_sensible','dermatitis'] },
  'CANNABIS SATIVA SEED OIL': { nombre_com:'Aceite de cáñamo', categorias:[], severidad:'verde', comedogenico:0, nota:'Aceite vegetal con ratio omega-6/omega-3 ideal (3:1). No contiene THC ni CBD (son compuestos de la planta, no de la semilla). Antiinflamatorio, regulador del sebo y reparador de la barrera. Comedogenicidad 0/5. Muy adecuado para pieles mixtas, grasas y con acné.', lactancia:'ok', afecciones_utiles:['acne'] },
  'HEMP SEED OIL': { alias:'CANNABIS SATIVA SEED OIL' },
  'PUNICA GRANATUM SEED OIL': { nombre_com:'Aceite de granada', categorias:[], severidad:'verde', comedogenico:1, nota:'Único aceite vegetal con ácido punicínico (omega-5 conjugado). Antioxidante potente, regenerador y antiinflamatorio. Comedogenicidad baja (1/5). Activo antiedad en cosmética natural.', lactancia:'ok' },
  'OPUNTIA FICUS-INDICA SEED OIL': { nombre_com:'Aceite de higo chumbo', categorias:[], severidad:'verde', comedogenico:0, nota:'Excepcionalmente rico en vitamina E y esteroles vegetales. Antioxidante potente. Comedogenicidad 0/5. Uno de los aceites más valiosos de la cosmética natural (precio elevado por la extracción manual de semillas).', lactancia:'ok' },
  'SCLEROCARYA BIRREA SEED OIL': { nombre_com:'Aceite de marula', categorias:[], severidad:'verde', comedogenico:2, nota:'Aceite vegetal africano rico en ácido oleico (70%) y antioxidantes. Textura ligera y seca. Antiedad y nutritivo. Comedogenicidad moderada-baja (2/5). Bien tolerado por la mayoría de tipos de piel.', lactancia:'ok' },
  'ADANSONIA DIGITATA SEED OIL': { nombre_com:'Aceite de baobab', categorias:[], severidad:'verde', comedogenico:2, nota:'Aceite del árbol africano baobab. Rico en omega-3, 6 y 9. Nutritivo, emoliente y antioxidante. Absorción rápida. Comedogenicidad moderada-baja (2/5).', lactancia:'ok' },
  'MORINGA OLEIFERA SEED OIL': { nombre_com:'Aceite de moringa', categorias:[], severidad:'verde', comedogenico:2, nota:'Alto contenido en ácido oleico (70%) y ácido behénico, lo que le confiere estabilidad excepcional. Antioxidante y emoliente. Históricamente usado en Egipto antiguo. Comedogenicidad moderada (2/5).', lactancia:'ok' },
  'NIGELLA SATIVA SEED OIL': { nombre_com:'Aceite de nigela (comino negro)', categorias:[], severidad:'verde', comedogenico:2, nota:'Rico en timoquinona, activo antiinflamatorio y antioxidante bien estudiado. Muy usado en cosmética natural para piel reactiva, rosácea y acné. Aroma intenso y característico. Comedogenicidad moderada-baja (2/5).', lactancia:'ok', afecciones_utiles:['rosácea','acne','piel_sensible'] },
  'PRUNUS ARMENIACA KERNEL OIL': { nombre_com:'Aceite de hueso de albaricoque', categorias:[], severidad:'verde', comedogenico:2, nota:'Aceite emoliente suave y ligero, rico en ácido oleico. Textura sedosa. Similar al aceite de almendra dulce pero con textura algo más seca. Comedogenicidad moderada-baja (2/5). Habitual en cosmética natural.', lactancia:'ok' },
  'APRICOT KERNEL OIL': { alias:'PRUNUS ARMENIACA KERNEL OIL' },
  'PRUNUS PERSICA KERNEL OIL': { nombre_com:'Aceite de hueso de melocotón', categorias:[], severidad:'verde', comedogenico:2, nota:'Muy similar al aceite de albaricoque. Suave, emoliente y ligero. Rico en ácido oleico. Bien tolerado por todo tipo de piel. Comedogenicidad moderada-baja (2/5).', lactancia:'ok' },
  'LIMNANTHES ALBA SEED OIL': { nombre_com:'Aceite de meadowfoam', categorias:[], severidad:'verde', comedogenico:1, nota:'Aceite de composición única (80% ácidos grasos de cadena muy larga, C20-C22). Extraordinariamente estable frente a la oxidación. Emoliente y formador de película protectora. Habitual en cosmética natural capilar.', lactancia:'ok' },
  'MACADAMIA TERNIFOLIA SEED OIL': { nombre_com:'Aceite de macadamia', categorias:[], severidad:'verde', comedogenico:2, nota:'Excepcionalmente rico en ácido palmitoleico (omega-7), componente natural del sebo joven. Nutritivo y regenerador. Ideal para piel madura y seca. Comedogenicidad moderada (2/5).', lactancia:'ok' },
  'MACADAMIA INTEGRIFOLIA SEED OIL': { alias:'MACADAMIA TERNIFOLIA SEED OIL' },
  'PASSIFLORA EDULIS SEED OIL': { nombre_com:'Aceite de maracuyá', categorias:[], severidad:'verde', comedogenico:1, nota:'Aceite seco y ligero muy rico en ácido linoleico (omega-6). Baja comedogenicidad (1/5). Excelente para pieles mixtas y grasas. Antioxidante por su contenido en carotenoides.', lactancia:'ok', afecciones_utiles:['acne'] },
  'PRUNUS AVIUM KERNEL OIL': { nombre_com:'Aceite de hueso de cereza', categorias:[], severidad:'verde', comedogenico:2, nota:'Aceite emoliente ligero extraído del hueso de la cereza. Rico en ácidos grasos insaturados. Comedogenicidad moderada-baja (2/5). Suave, habitual en cosmética natural.', lactancia:'ok' },
  'SQUALANE': { nombre_com:'Escualano', categorias:[], severidad:'verde', comedogenico:1, nota:'Forma saturada y estable del escualeno. Puede ser de origen vegetal (olivo, caña de azúcar — preferible) o marino (hígado de tiburón — evitar). Verificar el origen. Emoliente ligero y estable que imita los lípidos naturales de la piel. Baja comedogenicidad (1/5).', lactancia:'ok' },
  'PHYTOSQUALANE': { alias:'SQUALANE' },
  'COCO-CAPRYLATE': { nombre_com:'Coco-caprilato', categorias:[], severidad:'verde', nota:'Ester natural derivado del aceite de coco y ácido caprílico. Emoliente ligero y seco. Alternativa natural a los emolientes petroquímicos. Sensorial excelente. Aceptado en cosmética natural.', lactancia:'ok' },
  'COCO-CAPRYLATE/CAPRATE': { alias:'COCO-CAPRYLATE' },
  'ISOAMYL LAURATE': { nombre_com:'Laurato de isoamilo', categorias:[], severidad:'verde', nota:'Ester natural derivado del aceite de coco. Emoliente ligero con textura seca. Alternativa natural a los emolientes petroquímicos. Aceptado en cosmética natural.', lactancia:'ok' },

  // ── MANTECAS ADICIONALES ─────────────────────────────────────────────────
  'SHOREA STENOPTERA SEED BUTTER': { nombre_com:'Manteca de sal (illipe)', categorias:[], severidad:'verde', comedogenico:1, nota:'Manteca vegetal asiática muy rica en ácido esteárico. Textura más dura que el karité. Excelente estabilizante en formulación. Comedogenicidad baja (1/5). Aceptada en cosmética natural.', lactancia:'ok' },
  'GARCINIA INDICA SEED BUTTER': { nombre_com:'Manteca de kokum', categorias:[], severidad:'verde', comedogenico:0, nota:'Manteca muy dura, rica en ácido esteárico. Propiedades astringentes y regeneradoras. Comedogenicidad mínima (0/5). Habitual en cosméticos sólidos y labiales naturales.', lactancia:'ok' },
  'LANOLIN': { nombre_com:'Lanolina', categorias:[], severidad:'verde', comedogenico:1, nota:'Cera natural de las glándulas sebáceas de la lana de oveja. Muy similar a los lípidos de la piel humana. Emoliente, oclusiva y reparadora de la barrera. No apta para veganos. Puede causar alergia de contacto en personas sensibles a la lana. Comedogenicidad baja (1/5).', lactancia:'ok' },

  // ── EMULSIONANTES Y ESPESANTES NATURALES ADICIONALES ────────────────────
  'CETEARYL OLIVATE': { nombre_com:'Olivato de cetearilo', categorias:[], severidad:'verde', nota:'Emulsionante natural derivado del aceite de oliva y alcoholes grasos. Componente de Olivem 1000 (junto con sorbitan olivate). Aceptado en cosmética natural y orgánica certificada COSMOS.', lactancia:'ok' },
  'SORBITAN OLIVATE': { nombre_com:'Olivato de sorbitán', categorias:[], severidad:'verde', nota:'Emulsionante natural derivado del ácido oleico del olivo y sorbitol. Componente de Olivem 1000. Aceptado en cosmética natural certificada COSMOS. Muy similar a los emulsionantes de la piel humana.', lactancia:'ok' },
  'GLYCERYL CAPRYLATE': { nombre_com:'Caprilato de glicerilo', categorias:[], severidad:'verde', nota:'Ester natural de glicerina y ácido caprílico (coco). Emoliente con actividad conservante adicional. Aceptado en cosmética natural certificada COSMOS. Refuerza la actividad antimicrobiana de conservantes.', lactancia:'ok' },
  'CETEARYL GLUCOSIDE': { nombre_com:'Glucósido de cetearilo', categorias:[], severidad:'verde', nota:'Emulsionante natural derivado de la glucosa y alcoholes grasos vegetales. Aceptado en cosmética natural y orgánica certificada COSMOS. Muy suave.', lactancia:'ok' },
  'SUCROSE COCOATE': { nombre_com:'Cocoato de sacarosa', categorias:[], severidad:'verde', nota:'Ester natural de azúcar y ácido graso de coco. Emulsionante y emoliente. Aceptado en cosmética natural.', lactancia:'ok' },
  'JOJOBA ESTERS': { nombre_com:'Esteres de jojoba', categorias:[], severidad:'verde', nota:'Cera sólida derivada del aceite de jojoba hidrogenado e interesterificado. Alternativa vegana a la cera de abeja. Aceptada en cosmética natural.', lactancia:'ok' },
  'STEARYL ALCOHOL': { nombre_com:'Alcohol estearílico', categorias:[], severidad:'verde', nota:'Alcohol graso saturado de cadena larga (C18) de origen vegetal. No deseca. Emoliente y espesante en emulsiones. Aceptado en cosmética natural. No confundir con alcoholes desnaturalizantes.', lactancia:'ok' },
  'PALMITIC ACID': { nombre_com:'Ácido palmítico', categorias:[], severidad:'verde', comedogenico:2, nota:'Ácido graso saturado presente de forma natural en el sebo humano y muchos aceites vegetales. Emoliente y espesante. Comedogenicidad moderada (2/5). Natural y aceptado en cosmética.', lactancia:'ok' },
  'LINOLEIC ACID': { nombre_com:'Ácido linoleico (omega-6)', categorias:[], severidad:'verde', comedogenico:0, nota:'Ácido graso esencial (omega-6) componente clave de la barrera cutánea. Deficitario en pieles acneicas y con barrera comprometida. De origen vegetal. Comedogenicidad 0/5. Reparador de la barrera lipídica.', lactancia:'ok', afecciones_utiles:['acne'] },
  'HYDROXYETHYLCELLULOSE': { nombre_com:'Hidroxietilcelulosa', categorias:[], severidad:'verde', nota:'Celulosa modificada. Espesante y gelificante aceptado en cosmética natural certificada COSMOS. Forma texturas gel transparentes. Sin restricciones.', lactancia:'ok' },
  'HYDROXYPROPYL METHYLCELLULOSE': { nombre_com:'Hidroxipropil metilcelulosa (HPMC)', categorias:[], severidad:'verde', nota:'Celulosa modificada. Espesante y texturizante. Aceptado en cosmética natural.', lactancia:'ok' },
  'MICROCRYSTALLINE CELLULOSE': { nombre_com:'Celulosa microcristalina', categorias:[], severidad:'verde', nota:'Celulosa vegetal procesada. Texturizante y carga en polvos. Natural. Sin restricciones.', lactancia:'ok' },
  'CELLULOSE': { nombre_com:'Celulosa', categorias:[], severidad:'verde', nota:'Polisacárido vegetal estructural. Espesante, abrasivo suave y formador de película. Natural. Aceptado en cosmética natural.', lactancia:'ok' },
  'SODIUM ALGINATE': { nombre_com:'Alginato de sodio', categorias:[], severidad:'verde', nota:'Polisacárido de algas marrones. Gelificante y espesante. Aceptado en cosmética natural. Habitual en mascarillas y cosméticos de algas.', lactancia:'ok' },
  'AGAR': { nombre_com:'Agar', categorias:[], severidad:'verde', nota:'Polisacárido natural de algas rojas. Gelificante y espesante. Aceptado en cosmética natural.', lactancia:'ok' },
  'CARRAGEENAN': { nombre_com:'Carragenano', categorias:[], severidad:'verde', nota:'Polisacárido extraído de algas rojas. Espesante y gelificante. Aceptado en cosmética natural. La forma degradada puede ser inflamatoria por vía oral, pero en cosmética no hay evidencia de riesgo.', lactancia:'ok' },
  'PULLULAN': { nombre_com:'Pululano', categorias:[], severidad:'verde', nota:'Polisacárido obtenido por fermentación fúngica. Formador de película tensora (efecto lifting inmediato). Habitual en sérums antiedad de cosmética natural. Sin restricciones.', lactancia:'ok' },
  'INULIN': { nombre_com:'Inulina', categorias:[], severidad:'verde', nota:'Polisacárido natural extraído de la raíz de achicoria. Humectante y prebiótico para el microbioma de la piel. Aceptado en cosmética natural.', lactancia:'ok' },

  // ── TENSIOACTIVOS NATURALES ──────────────────────────────────────────────
  'DECYL GLUCOSIDE': { nombre_com:'Decil glucósido', categorias:[], severidad:'verde', nota:'Tensioactivo suave derivado de la glucosa y decanol (coco). Uno de los más frecuentes en cosmética natural. Aceptado en cosmética certificada COSMOS. Muy bien tolerado incluyendo pieles sensibles.', lactancia:'ok' },
  'COCO GLUCOSIDE': { nombre_com:'Coco glucósido', categorias:[], severidad:'verde', nota:'Tensioactivo suave de glucosa y alcohol de coco. Aceptado en cosmética natural certificada COSMOS. Similar al decil glucósido, algo más espumante. Habitual en champús y geles naturales.', lactancia:'ok' },
  'LAURYL GLUCOSIDE': { nombre_com:'Lauril glucósido', categorias:[], severidad:'verde', nota:'Tensioactivo suave de glucosa y lauril alcohol (coco). Aceptado en cosmética natural. Sin restricciones.', lactancia:'ok' },
  'CAPRYLYL/CAPRYL GLUCOSIDE': { nombre_com:'Caprililcaprilo glucósido', categorias:[], severidad:'verde', nota:'Tensioactivo de cadena corta-media derivado de la glucosa. Aceptado en cosmética natural. Ideal para pieles muy sensibles por su suavidad extrema.', lactancia:'ok' },
  'SODIUM COCOYL GLUTAMATE': { nombre_com:'Cocoil glutamato de sodio', categorias:[], severidad:'verde', nota:'Tensioactivo derivado del ácido glutámico (aminoácido) y aceite de coco. Aceptado en cosmética natural y certificada COSMOS. Muy suave, respeta el pH ácido de la piel. Sin restricciones.', lactancia:'ok' },
  'SODIUM LAUROYL GLUTAMATE': { nombre_com:'Lauroil glutamato de sodio', categorias:[], severidad:'verde', nota:'Tensioactivo de aminoácido muy suave. Derivado del ácido glutámico y ácido láurico (coco). Aceptado en cosmética natural. Limpiador gentil para pieles sensibles.', lactancia:'ok' },
  'DISODIUM COCOYL GLUTAMATE': { nombre_com:'Cocoil glutamato de disodio', categorias:[], severidad:'verde', nota:'Variante del cocoil glutamato de sodio. Origen natural. Tensioactivo suave aceptado en cosmética natural.', lactancia:'ok' },
  'SODIUM COCOYL ISETHIONATE': { nombre_com:'Cocoil isethionato de sodio', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Tensioactivo suave derivado del coco con modificación química. Muy habitual en jabones sólidos y champús sólidos. No aceptado en cosmética orgánica certificada COSMOS, pero sí en algunas certificaciones naturales.', lactancia:'ok' },
  'POTASSIUM COCOATE': { nombre_com:'Cocoato de potasio (jabón de coco)', categorias:[], severidad:'verde', nota:'Sal potásica de los ácidos grasos del aceite de coco. Resultado de la saponificación. Jabón natural por excelencia. Aceptado en cosmética natural certificada.', lactancia:'ok' },
  'SODIUM COCOATE': { nombre_com:'Cocoato de sodio (jabón duro de coco)', categorias:[], severidad:'verde', nota:'Sal sódica de los ácidos grasos del aceite de coco. Base de jabones sólidos. Jabón natural. Puede resecar pieles muy sensibles por su pH elevado.', lactancia:'ok' },
  'SODIUM OLIVATE': { nombre_com:'Olivato de sodio (jabón de oliva)', categorias:[], severidad:'verde', nota:'Sal sódica de los ácidos grasos del aceite de oliva. Base del jabón de Castilla. Jabón natural muy clásico.', lactancia:'ok' },

  // ── HUMECTANTES NATURALES ────────────────────────────────────────────────
  'BETAINE': { nombre_com:'Betaína', categorias:[], severidad:'verde', nota:'Osmoprotector natural obtenido del azúcar de remolacha. Humectante, calmante y antiirritante. Reduce la irritación de otros ingredientes (coformulación con tensioactivos). Ampliamente aceptado en cosmética natural. Sin restricciones.', lactancia:'ok' },
  'SORBITOL': { nombre_com:'Sorbitol', categorias:[], severidad:'verde', nota:'Alcohol de azúcar presente en frutas (ciruelas, manzanas). Humectante suave. De origen natural. Aceptado en cosmética natural.', lactancia:'ok' },
  'TREHALOSE': { nombre_com:'Trehalosa', categorias:[], severidad:'verde', nota:'Disacárido natural producido por microorganismos y algunos vegetales. Criptoprotector excelente — protege proteínas y membranas celulares de la desecación. Humectante activa en situaciones de estrés osmótico. Aceptado en cosmética natural.', lactancia:'ok' },
  'ERYTHRITOL': { nombre_com:'Eritritol', categorias:[], severidad:'verde', nota:'Poliol natural presente en frutas y fermentación. Humectante suave. Aceptado en cosmética natural.', lactancia:'ok' },
  'FRUCTOSE': { nombre_com:'Fructosa', categorias:[], severidad:'verde', nota:'Azúcar simple natural de frutas. Humectante suave. Aceptado en cosmética natural.', lactancia:'ok' },
  'GLUCOSE': { nombre_com:'Glucosa', categorias:[], severidad:'verde', nota:'Azúcar simple natural. Humectante suave y fuente de energía celular. Aceptado en cosmética natural.', lactancia:'ok' },
  'UREA': { nombre_com:'Urea', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Componente natural del NMF (Factor Natural de Hidratación), obtenido por síntesis. Humectante a bajas concentraciones (2-5%); queratolítico suave a concentraciones medias (5-10%); queratolítico intenso a altas (>10%). No aceptado en cosmética certificada aunque la molécula sea natural. Muy eficaz en piel seca y con hiperqueratosis.', lactancia:'ok', afecciones_utiles:['piel_seca'] },
  'HYDROLYZED HYALURONIC ACID': { nombre_com:'Ácido hialurónico hidrolizado (bajo PM)', categorias:[], severidad:'verde', nota:'HA de bajo peso molecular. Mejor penetración cutánea que el hialuronato de sodio estándar — hidratación en capas más profundas. Aceptado en cosmética natural.', lactancia:'ok' },
  'HYDROLYZED COLLAGEN': { nombre_com:'Colágeno hidrolizado', categorias:[], severidad:'verde', nota:'Proteína hidrolizada de origen animal (bovino o marino). Condicionante y humectante de la piel. No sustituye al colágeno endógeno por vía tópica (molécula demasiado grande para penetrar las capas profundas). Natural de origen animal, no vegano.', lactancia:'ok' },
  'HYDROLYZED SILK': { nombre_com:'Seda hidrolizada', categorias:[], severidad:'verde', nota:'Proteína de seda fragmentada. Condicionante, suavizante y creadora de película protectora. Natural de origen animal. Habitual en cosmética natural capilar y facial.', lactancia:'ok' },
  'HYDROLYZED SILK PROTEIN': { alias:'HYDROLYZED SILK' },
  'HYDROLYZED WHEAT PROTEIN': { nombre_com:'Proteína de trigo hidrolizada', categorias:['irritante'], severidad:'amarillo', nota:'Proteína de trigo fragmentada. Condicionante y suavizante. Ha provocado sensibilizaciones con posterior desarrollo de alergias alimentarias al trigo (vía cutánea — caso Pantene Japón). Precaución en personas con sensibilidad al gluten.', lactancia:'ok', afecciones_relevantes:['piel_sensible'] },

  // ── EXTRACTOS BOTÁNICOS ADICIONALES ─────────────────────────────────────
  'HAMAMELIS VIRGINIANA EXTRACT': { nombre_com:'Extracto de hamamelis', categorias:['irritante'], severidad:'amarillo', nota:'Extracto astringente rico en taninos. El extracto alcohólico puede irritar. El extracto sin alcohol es calmante y astringente suave, útil en pieles mixtas y grasas. Precaución en piel sensible y rosácea — el mentol y el alcohol de algunos preparados son el problema real.', lactancia:'ok', afecciones_relevantes:['piel_sensible','rosácea'] },
  'HAMAMELIS VIRGINIANA WATER': { nombre_com:'Agua floral de hamamelis (sin alcohol)', categorias:[], severidad:'verde', nota:'Hidrosol de hamamelis sin alcohol. Astringente y calmante suave. Bien tolerado incluyendo pieles sensibles. Diferente al extracto alcohólico.', lactancia:'ok' },
  'GLYCYRRHIZA GLABRA ROOT EXTRACT': { nombre_com:'Extracto de raíz de regaliz', categorias:[], severidad:'verde', nota:'Rico en glabridina, potente inhibidor de la tirosinasa. Despigmentante, antiinflamatorio y calmante. Usado en cosmética natural para manchas y pieles reactivas. Sin restricciones.', lactancia:'ok' },
  'CURCUMA LONGA ROOT EXTRACT': { nombre_com:'Extracto de cúrcuma', categorias:[], severidad:'verde', nota:'Rico en curcuminoides. Antiinflamatorio, antioxidante y con propiedades despigmentantes. En concentraciones altas puede teñir levemente. Habitual en cosmética natural para piel inflamada y reactiva.', lactancia:'ok', afecciones_utiles:['rosácea','acne'] },
  'GINKGO BILOBA LEAF EXTRACT': { nombre_com:'Extracto de hoja de ginkgo', categorias:[], severidad:'verde', nota:'Antioxidante rico en flavonoides y terpenoides. Activa la circulación microvascular. Antiinflamatorio. Habitual en cosmética natural antiedad.', lactancia:'ok' },
  'COFFEA ARABICA SEED EXTRACT': { nombre_com:'Extracto de semilla de café', categorias:[], severidad:'verde', nota:'Rico en cafeína y polifenoles. Activo vasoconstrictor y drenante (base del efecto antiojeras y anticélulitis). Antioxidante potente. Aceptado en cosmética natural.', lactancia:'ok' },
  'VACCINIUM MYRTILLUS FRUIT EXTRACT': { nombre_com:'Extracto de arándano', categorias:[], severidad:'verde', nota:'Rico en antocianinas y AHAs suaves. Antioxidante, iluminador y con leve acción exfoliante natural. Habitual en cosmética natural antiedad y para manchas.', lactancia:'ok' },
  'MALUS DOMESTICA FRUIT EXTRACT': { nombre_com:'Extracto de manzana', categorias:[], severidad:'verde', nota:'Rico en polifenoles antioxidantes. El extracto de célula madre de manzana (variedad Uttwiler Spätlauber) es activo antiedad popular en cosmética natural premium.', lactancia:'ok' },
  'FUCUS VESICULOSUS EXTRACT': { nombre_com:'Extracto de alga vejiga', categorias:[], severidad:'verde', nota:'Alga marrón rica en fucoidano y minerales. Drenante, antioxidante y estimulante del metabolismo celular. Habitual en cosmética natural reafirmante y anticélulitis.', lactancia:'ok' },
  'CHONDRUS CRISPUS EXTRACT': { nombre_com:'Extracto de Irish moss (alga roja)', categorias:[], severidad:'verde', nota:'Alga roja rica en polisacáridos. Hidratante y formadora de película protectora. Precursor del carragenano. Activo hidratante en cosmética natural.', lactancia:'ok' },
  'SPIRULINA PLATENSIS EXTRACT': { nombre_com:'Extracto de espirulina', categorias:[], severidad:'verde', nota:'Microalga rica en ficocianinas, proteínas y minerales. Antioxidante y revitalizante. Creciente presencia en cosmética natural. Sin restricciones.', lactancia:'ok' },
  'ARTHROSPIRA PLATENSIS EXTRACT': { alias:'SPIRULINA PLATENSIS EXTRACT' },
  'PORTULACA OLERACEA EXTRACT': { nombre_com:'Extracto de verdolaga', categorias:[], severidad:'verde', nota:'Planta suculenta rica en ácido linoléico y omega-3. Calmante, antioxidante y reparador de la barrera. Activo de interés en cosmética natural para pieles sensibles y reactivas.', lactancia:'ok', afecciones_utiles:['piel_sensible','rosácea'] },
  'HIBISCUS SABDARIFFA FLOWER EXTRACT': { nombre_com:'Extracto de hibisco', categorias:[], severidad:'verde', nota:'Rico en AHAs naturales (ácido cítrico, tartárico, málico) y antocianinas. Suavemente exfoliante, iluminador y antioxidante. Activo antiedad natural.', lactancia:'ok' },
  'SAMBUCUS NIGRA FLOWER EXTRACT': { nombre_com:'Extracto de flor de saúco', categorias:[], severidad:'verde', nota:'Rico en flavonoides y ácidos fenólicos. Calmante, antiinflamatorio y levemente iluminador. Habitual en cosmética natural.', lactancia:'ok' },

  // ── AGUAS E HIDROSOLES ADICIONALES ──────────────────────────────────────
  'CHAMOMILLA RECUTITA FLOWER WATER': { nombre_com:'Agua floral de manzanilla', categorias:[], severidad:'verde', nota:'Hidrosol de manzanilla. Calmante, antiinflamatorio y suavizante. Habitual en cosmética natural para pieles sensibles.', lactancia:'ok', afecciones_utiles:['piel_sensible','rosácea'] },
  'CITRUS AURANTIUM AMARA FLOWER WATER': { nombre_com:'Agua floral de azahar (neroli)', categorias:[], severidad:'verde', nota:'Hidrosol de flor de naranjo amargo. Equilibrante, calmante y levemente astringente. Uno de los hidrosoles más apreciados en cosmética natural.', lactancia:'ok' },
  'MELISSA OFFICINALIS LEAF WATER': { nombre_com:'Agua floral de melisa', categorias:[], severidad:'verde', nota:'Hidrosol de melisa. Calmante, levemente astringente. Habitual en cosmética natural sensible.', lactancia:'ok' },
  'MENTHA PIPERITA WATER': { nombre_com:'Agua floral de menta', categorias:['irritante'], severidad:'amarillo', nota:'Hidrosol de menta. Refrescante. Puede irritar pieles muy sensibles. No usar en bebés ni niños.', lactancia:'precaucion', afecciones_relevantes:['piel_sensible','rosácea'] },

  // ── MINERALES Y ARCILLAS ─────────────────────────────────────────────────
  'ZINC OXIDE': { nombre_com:'Óxido de zinc (CI 77947)', categorias:[], severidad:'verde', nota:'Filtro UV mineral de amplio espectro UVA y UVB. Aceptado en cosmética natural y orgánica certificada COSMOS en grado no-nano. Las nanopartículas están bajo restricciones en la UE. Además de fotoprotector: antiséptico, astringente y calmante. Habitual en solares naturales, cremas de pañal y bases de maquillaje mineral.', lactancia:'ok' },
  'CI 77947': { alias:'ZINC OXIDE' },
  'KAOLIN': { nombre_com:'Caolín', categorias:[], severidad:'verde', nota:'Arcilla mineral natural. Absorbente de sebo, purificante y suavizante. Muy bien tolerada. Habitual en mascarillas y polvos de cosmética natural. Sin restricciones.', lactancia:'ok' },
  'BENTONITE': { nombre_com:'Bentonita', categorias:[], severidad:'verde', nota:'Arcilla volcánica natural absorbente y desintoxicante. Mayor poder de absorción que el caolín. Habitual en mascarillas de limpieza profunda. Sin restricciones.', lactancia:'ok' },
  'SILICA': { nombre_com:'Sílice', categorias:[], severidad:'verde', nota:'Dióxido de silicio de origen mineral natural. Absorbente de sebo, texturizante y carga en polvos y maquillaje mineral. Sin restricciones (la forma nano es diferente y está bajo seguimiento).', lactancia:'ok' },
  'MICA': { nombre_com:'Mica (CI 77019)', categorias:[], severidad:'verde', nota:'Mineral natural silicato. Da efecto shimmer e iluminador en cosméticos. Aceptado en cosmética natural certificada. Nota ética: verificar origen (existe trabajo infantil en algunas minas — buscar proveedores certificados).', lactancia:'ok' },
  'CI 77019': { alias:'MICA' },
  'IRON OXIDES': { nombre_com:'Óxidos de hierro (CI 77491/77492/77499)', categorias:[], severidad:'verde', nota:'Pigmentos minerales naturales. CI 77491 (rojo), CI 77492 (amarillo), CI 77499 (negro). Colorantes de origen mineral aceptados en cosmética natural y orgánica. Sin restricciones.', lactancia:'ok' },
  'CI 77491': { alias:'IRON OXIDES' },
  'CI 77492': { alias:'IRON OXIDES' },
  'CI 77499': { alias:'IRON OXIDES' },
  'MAGNESIUM STEARATE': { nombre_com:'Estearato de magnesio', categorias:[], severidad:'verde', nota:'Sal de magnesio del ácido esteárico (grasas vegetales). Antiaglomerante en polvos y maquillaje mineral. Aceptado en cosmética natural.', lactancia:'ok' },
  'TALC': { nombre_com:'Talco (silicato de magnesio)', categorias:[], severidad:'verde', nota:'Mineral natural en polvo. Absorbente y deslizante en polvos y maquillaje. La calidad farmacéutica garantiza ausencia de asbesto. Bajo revisión en productos de bebé y zona genital por asociación con uso prolongado e inadecuado.', lactancia:'ok' },
  'MAGNESIUM SILICATE': { alias:'TALC' },
  'CALCIUM CARBONATE': { nombre_com:'Carbonato de calcio', categorias:[], severidad:'verde', nota:'Mineral natural (calcita). Abrasivo suave en dentífricos y exfoliantes. Sin restricciones.', lactancia:'ok' },
  'HYDROXYAPATITE': { nombre_com:'Hidroxiapatita', categorias:[], severidad:'verde', nota:'Mineral constituyente del esmalte dental. Usado en dentífricos como activo remineralizante y, en cosmética facial, como filtro UV físico alternativo en desarrollo. Sin restricciones.', lactancia:'ok' },
  'ZINC STEARATE': { nombre_com:'Estearato de zinc', categorias:[], severidad:'verde', nota:'Sal de zinc del ácido esteárico. Antiaglomerante y adhesivo en polvos de maquillaje mineral. Aceptado en cosmética natural.', lactancia:'ok' },

  // ── CONSERVANTES NATURALES ADICIONALES ──────────────────────────────────
  'GLUCONOLACTONE': { nombre_com:'Gluconolactona (PHA)', categorias:[], severidad:'verde', nota:'Polihidroxiácido (PHA) derivado de la glucosa. Exfoliante muy suave con acción humectante y antioxidante simultánea. Mucho mejor tolerado que los AHAs clásicos en piel sensible. Leve acción conservante adicional. Aceptado en cosmética natural.', lactancia:'ok' },
  'SODIUM LEVULINATE': { nombre_com:'Levulinato de sodio', categorias:[], severidad:'verde', nota:'Sal sódica del ácido levulínico, derivado del azúcar. Conservante natural de pH moderador. Habitualmente combinado con anisato de sodio. Aceptado en cosmética natural certificada COSMOS.', lactancia:'ok' },
  'SODIUM ANISATE': { nombre_com:'Anisato de sodio', categorias:[], severidad:'verde', nota:'Sal sódica del ácido anísico (anís estrellado). Conservante natural de origen botánico. Aceptado en cosmética natural certificada COSMOS. Suele combinarse con levulinato de sodio.', lactancia:'ok' },
  'LACTOBACILLUS FERMENT': { nombre_com:'Fermento de Lactobacillus', categorias:[], severidad:'verde', nota:'Lisado de fermentación bacteriana. Prebiótico para el microbioma cutáneo. Fortalece la barrera y modula la respuesta inflamatoria. Creciente presencia en cosmética natural microbioma-friendly. Sin restricciones.', lactancia:'ok' },
  'ETHYLHEXYLGLYCERIN': { nombre_com:'Etilhexilglicerina', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Derivado de la glicerina de síntesis química. Conservante y potenciador de otros conservantes. Muy habitual combinado con fenoxietanol. Bien tolerado pero no aceptado en cosmética orgánica certificada COSMOS.', lactancia:'ok' },
  '1,2-HEXANEDIOL': { nombre_com:'1,2-Hexanodiol', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Diol de síntesis con actividad conservante y humectante. Muy habitual en cosmética moderna. Bien tolerado. No aceptado en cosmética certificada COSMOS.', lactancia:'ok' },
  'CAPRYLYL GLYCOL': { nombre_com:'Caprililglicol', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Derivado de glicerina y ácido caprílico de síntesis. Conservante y humectante. Bien tolerado. No aceptado en cosmética certificada COSMOS.', lactancia:'ok' },
  'PENTYLENE GLYCOL': { nombre_com:'Pentilenglicol', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Diol de síntesis con actividad humectante y conservante. Alternativa al fenoxietanol. Bien tolerado. No aceptado en cosmética certificada COSMOS.', lactancia:'ok' },
  'HYDROXYACETOPHENONE': { nombre_com:'Hidroxiacetofenona', categorias:['no_cosmetica_natural'], severidad:'amarillo', nota:'Fenol de síntesis con actividad conservante y antioxidante. Bien tolerado. No aceptado en cosmética certificada COSMOS.', lactancia:'ok' },

  // ── ACEITES ESENCIALES ADICIONALES ──────────────────────────────────────
  'LAVANDULA ANGUSTIFOLIA OIL': { nombre_com:'Aceite esencial de lavanda', categorias:['fragrance_ae'], severidad:'verde', nota:'AE calmante, cicatrizante y levemente antiséptico. Uno de los más seguros y versátiles. Contiene linalool y acetato de linalilo (Anexo III UE). Bien tolerado a concentraciones apropiadas en cosmética natural.', lactancia:'ok' },
  'LAVANDULA OFFICINALIS OIL': { alias:'LAVANDULA ANGUSTIFOLIA OIL' },
  'MELALEUCA ALTERNIFOLIA LEAF OIL': { nombre_com:'Aceite esencial de árbol de té (tea tree)', categorias:['irritante'], severidad:'amarillo', nota:'AE con potentes propiedades antimicrobianas. Útil en acné y eccemas infectados. Puede irritar y sensibilizar con uso concentrado o prolongado — nunca puro sobre la piel. Contraindicado en niños y en embarazo a altas concentraciones.', lactancia:'precaucion', afecciones_relevantes:['piel_sensible'], afecciones_utiles:['acne'] },
  'PELARGONIUM GRAVEOLENS FLOWER OIL': { nombre_com:'Aceite esencial de geranio', categorias:['fragrance_ae'], severidad:'verde', nota:'AE equilibrante y levemente astringente. Habitual en cosmética natural. Contiene geraniol y citronelol (Anexo III UE). Bien tolerado a concentraciones apropiadas en cosmética orgánica.', lactancia:'ok' },
  'BOSWELLIA CARTERII OIL': { nombre_com:'Aceite esencial de incienso (olíbano)', categorias:[], severidad:'verde', nota:'AE antiinflamatorio, cicatrizante y antiedad. Activa la síntesis de colágeno. Muy apreciado en cosmética natural de lujo. Sin restricciones conocidas a concentraciones cosméticas.', lactancia:'ok' },
  'ROSA DAMASCENA FLOWER OIL': { nombre_com:'Aceite esencial de rosa', categorias:['fragrance_ae'], severidad:'verde', nota:'AE calmante, hidratante y antiinflamatorio. Contiene geraniol, citronelol y otros alérgenos del Anexo III UE. A concentraciones apropiadas, aceptado en cosmética orgánica. Uno de los AE más valiosos.', lactancia:'ok', afecciones_relevantes:['piel_sensible'] },
  'CHAMOMILLA RECUTITA FLOWER OIL': { nombre_com:'Aceite esencial de manzanilla alemana', categorias:[], severidad:'verde', nota:'AE azul (camazuleno) con excepcionales propiedades antiinflamatorias y calmantes. Especialmente útil en pieles sensibles y con rosácea. Sin restricciones a concentraciones apropiadas.', lactancia:'ok', afecciones_utiles:['rosácea','piel_sensible'] },
  'CYMBOPOGON MARTINI OIL': { nombre_com:'Aceite esencial de palmarosa', categorias:['fragrance_ae'], severidad:'verde', nota:'AE con alto contenido en geraniol (>75%). Hidratante y equilibrante. Contiene geraniol (Anexo III UE). Aceptado en cosmética natural.', lactancia:'ok' },
  'POGOSTEMON CABLIN OIL': { nombre_com:'Aceite esencial de pachulí', categorias:['fragrance_ae'], severidad:'verde', nota:'AE terroso, antiinflamatorio y cicatrizante. Contiene patchoulol. Habitual en cosmética natural y perfumería orgánica.', lactancia:'ok' },
  'CANANGA ODORATA FLOWER OIL': { nombre_com:'Aceite esencial de ylang ylang', categorias:['fragrance_ae','irritante'], severidad:'amarillo', nota:'AE floral muy intenso. Puede causar cefaleas en altas concentraciones. Contiene geraniol, linalool, benzyl alcohol y benzyl benzoate (todos Anexo III UE). Precaución en pieles sensibles.', lactancia:'ok', afecciones_relevantes:['piel_sensible'] },
  'CEDRUS ATLANTICA WOOD OIL': { nombre_com:'Aceite esencial de cedro del Atlas', categorias:[], severidad:'verde', nota:'AE terroso y masculino. Habitual en perfumería natural. Propiedades linfáticas y drenantes.', lactancia:'precaucion' },
  'VETIVERIA ZIZANOIDES ROOT OIL': { nombre_com:'Aceite esencial de vetiver', categorias:[], severidad:'verde', nota:'AE terroso de raíces de vetiver. Calmante, antiinflamatorio. Habitual en perfumería y cosmética natural.', lactancia:'ok' },
  'CITRUS BERGAMIA PEEL OIL': { nombre_com:'Aceite esencial de bergamota', categorias:['irritante','fragrance_ae'], severidad:'amarillo', nota:'Contiene bergapteno (furanocumarina) fotosensibilizante. No usar en zonas expuestas al sol salvo versión bergapten-free. Contiene linalool y limoneno (Anexo III UE).', lactancia:'ok', afecciones_relevantes:['piel_sensible'] },
  'CITRUS AURANTIFOLIA PEEL OIL': { nombre_com:'Aceite esencial de lima', categorias:['irritante','fragrance_ae'], severidad:'amarillo', nota:'Fotosensibilizante por furocumarinas. No usar en zonas expuestas al sol.', lactancia:'ok', afecciones_relevantes:['piel_sensible'] },
  'JUNIPERUS COMMUNIS FRUIT OIL': { nombre_com:'Aceite esencial de enebro', categorias:['irritante'], severidad:'amarillo', nota:'AE purificante y astringente. Puede irritar pieles sensibles. Contraindicado en embarazo y lactancia por efecto estimulante renal.', lactancia:'evitar', afecciones_relevantes:['piel_sensible'] },
  'SALVIA OFFICINALIS OIL': { nombre_com:'Aceite esencial de salvia', categorias:['irritante'], severidad:'amarillo', nota:'AE purificante. Contiene tuyona, potencialmente tóxica en altas concentraciones. Contraindicado en embarazo y lactancia.', lactancia:'evitar' },
  'ROSMARINUS OFFICINALIS OIL': { nombre_com:'Aceite esencial de romero', categorias:['irritante'], severidad:'amarillo', nota:'AE estimulante y antioxidante. Puede irritar pieles sensibles y exacerbar rosácea. Precaución en embarazo y en epilepsia.', lactancia:'precaucion', afecciones_relevantes:['piel_sensible','rosácea'] },

  // ── COLORANTES NATURALES ─────────────────────────────────────────────────
  'BETA-CAROTENE': { nombre_com:'Beta-caroteno (CI 40800)', categorias:[], severidad:'verde', nota:'Carotenoide natural de zanahoria y otras plantas. Colorante naranja-rojo y antioxidante. Aceptado en cosmética natural. Sin restricciones.', lactancia:'ok' },
  'CI 40800': { alias:'BETA-CAROTENE' },
  'LAWSONIA INERMIS LEAF POWDER': { nombre_com:'Henna (polvo de Lawsonia inermis)', categorias:[], severidad:'verde', nota:'Colorante natural de la planta de la henna. Tinte capilar natural tradicional. Sin restricciones en la forma natural. Precaución: la "henna negra" contiene PPD (para-fenilendiamina), potente sensibilizante — este riesgo es del aditivo, no de la henna.', lactancia:'ok' },

  // ── ÁCIDOS Y ACTIVOS AMPLIACIÓN (14/9/2026) ──────────────────────────────
  'MANDELIC ACID': { nombre_com:'Ácido mandélico (AHA)', categorias:[], severidad:'verde', nota:'AHA de molécula grande derivado de almendras amargas — penetra más lento que el glicólico, por lo que irrita mucho menos. Buena opción de exfoliación suave en piel sensible o acneica. Fotosensibilizante como el resto de AHAs — usar SPF.', lactancia:'precaucion', afecciones_utiles:['piel_sensible','acne'] },
  'LACTOBIONIC ACID': { nombre_com:'Ácido lactobiónico (PHA)', categorias:[], severidad:'verde', nota:'Polihidroxiácido derivado de la lactosa, con molécula aún mayor que la gluconolactona. Exfoliante muy suave, con acción humectante y antioxidante añadida (quelante de metales). El PHA mejor tolerado en piel muy reactiva o con la barrera dañada.', lactancia:'ok' },
  'PHYTIC ACID': { nombre_com:'Ácido fítico', categorias:[], severidad:'verde', nota:'Ácido natural presente en semillas y cereales integrales. Actúa como quelante (capta metales que oxidan la fórmula) y como despigmentante suave al inhibir la tirosinasa. Bien tolerado, no fotosensibilizante como los AHA. Uso habitual hasta 2% en producto de uso continuado.', lactancia:'ok', afecciones_utiles:['manchas'] },
  'SULFUR': { nombre_com:'Azufre', categorias:[], severidad:'verde', nota:'Mineral con acción antibacteriana, antiinflamatoria y queratolítica suave — clásico en tratamientos de acné y rosácea desde hace más de un siglo (uso habitual 3-10%). Reseca la piel, conviene combinarlo con buena hidratación. Olor característico. Considerado seguro en embarazo.', lactancia:'ok', afecciones_utiles:['acne','rosácea'], afecciones_relevantes:['piel_seca'] },
  'ACETUM': { nombre_com:'Vinagre (de sidra de manzana)', categorias:['irritante'], severidad:'amarillo', nota:'Ácido acético de fermentación, tradicionalmente de sidra de manzana. Ayuda a equilibrar el pH de la piel y tiene cierta acción antibacteriana, pero es fácil de sobreusar: sin diluir puede irritar o dañar la barrera cutánea. Evitar en piel con la barrera comprometida o heridas abiertas.', lactancia:'ok', afecciones_relevantes:['piel_sensible','dermatitis'] },
  'VINEGAR': { alias:'ACETUM' },
  'NIACIN': { nombre_com:'Niacina / Vitamina PP (B3)', categorias:[], severidad:'amarillo', nota:'Forma ácida de la vitamina B3 — distinta de la niacinamida (la forma amida, mucho más usada en cosmética). A diferencia de la niacinamida, la niacina puede provocar enrojecimiento y sensación de calor pasajera ("flushing") al aplicarla, por eso se usa mucho menos en skincare de uso diario. Bien tolerada fuera de ese efecto puntual.', lactancia:'ok', afecciones_relevantes:['rosácea','piel_sensible'] },
  'QUILLAJA SAPONARIA BARK EXTRACT': { nombre_com:'Extracto de madera/corteza de Panamá (quillay)', categorias:[], severidad:'verde', nota:'Extracto de la corteza del "árbol del jabón" sudamericano, rico en saponinas naturales. Actúa como agente limpiador y espumante — alternativa natural a los tensioactivos sintéticos en champús y geles de limpieza. Bien tolerado, aunque puede dar sensibilidad en personas propensas a alergias.', lactancia:'ok' },
  'RAPHANUS SATIVUS (RADISH) ROOT EXTRACT': { nombre_com:'Extracto de rábano blanco', categorias:[], severidad:'verde', nota:'Extracto de raíz de rábano. Su forma fermentada (Leuconostoc/Radish Root Ferment Filtrate, tipo "Leucidal") es uno de los conservantes naturales más usados hoy en cosmética limpia: antimicrobiano de amplio espectro, muy bien tolerado incluso en piel sensible o de bebé. Comprobar si el INCI del producto especifica la versión fermentada.', lactancia:'ok' },
  'CAPSICUM ANNUUM FRUIT EXTRACT': { nombre_com:'Extracto de guindilla/pimiento rojo', categorias:['irritante'], severidad:'amarillo', nota:'Extracto rico en capsaicina, usado en bajas concentraciones para estimular la microcirculación (sensación de calor). Puede irritar y no es apto para piel con rosácea, dermatitis o barrera comprometida — precaución también si hay alergia a pimientos/guindillas.', lactancia:'precaucion', afecciones_relevantes:['rosácea','piel_sensible','dermatitis'] },
  'MAGNESIUM CHLORIDE': { nombre_com:'Cloruro de magnesio', categorias:[], severidad:'verde', nota:'Sal mineral usada como aporte de magnesio tópico y texturizante. La evidencia sobre absorción transdérmica real ("magnesio que llega al músculo") es débil — el efecto principal demostrado es local, sobre la piel. Bien tolerado; puede dar escozor puntual sobre piel irritada o con heridas.', lactancia:'ok' },
  'ARCTIUM LAPPA ROOT EXTRACT': { nombre_com:'Extracto de bardana', categorias:[], severidad:'verde', nota:'Extracto de raíz con antioxidantes (polifenoles) y acción antiinflamatoria, tradicionalmente usado en piel grasa/con tendencia acneica y para calmar irritación (eccema). Buen perfil de seguridad; precaución si hay alergia a plantas de la familia Asteraceae (como la manzanilla o la árnica).', lactancia:'ok', afecciones_utiles:['acne','dermatitis'] },
  'ARNICA MONTANA FLOWER EXTRACT': { nombre_com:'Extracto de árnica', categorias:[], severidad:'verde', nota:'Extracto floral con acción antiinflamatoria y calmante bien documentada, clásico para golpes/moratones y piel irritada. Solo para piel intacta — no aplicar sobre heridas abiertas. El uso tópico normal no tiene contraindicación clara en embarazo/lactancia (a diferencia del uso oral, sí contraindicado), pero se recomienda precaución por falta de estudios específicos.', lactancia:'precaucion', afecciones_utiles:['piel_sensible'] },

};

// Función para detectar PEG- (hay cientos de variantes)
// ══════════════════════════════════════════════════════════════════════════════
// Ampliación 2/11/2026 (misma base que lee-la-etiqueta.html)
// Generado con Python desde «Lee la etiqueta - fuentes/ampliacion.py» (igual que construir.py).
// Criterio: 🔴 posible riesgo para la salud · 🟡 inocuo pero sintético o con matiz (si es petroquímico, no entra en GAROA)
//           🟢 natural o aceptado en cosmética natural.
// ══════════════════════════════════════════════════════════════════════════════
const DB_EXTRA = {
"CITRIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"SODIUM HYDROXIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"POTASSIUM HYDROXIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"SODIUM CITRATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"POTASSIUM CITRATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"SODIUM LACTATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"POTASSIUM LACTATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"MALIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"TARTARIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"FUMARIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"PHOSPHORIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"DISODIUM PHOSPHATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"TRISODIUM PHOSPHATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"SODIUM PHOSPHATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"POTASSIUM PHOSPHATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"DIPOTASSIUM PHOSPHATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"SODIUM BICARBONATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"SODIUM ACETATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"CALCIUM HYDROXIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"MAGNESIUM HYDROXIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"SODIUM GLUCONATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"CALCIUM GLUCONATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"MAGNESIUM GLUCONATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"SODIUM CHLORIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Sal mineral. Inocua; aceptada en cosmética natural."
},
"MAGNESIUM SULFATE": {
"severidad": "verde",
"categorias": [],
"nota": "Sal mineral. Inocua; aceptada en cosmética natural."
},
"MAGNESIUM NITRATE": {
"severidad": "verde",
"categorias": [],
"nota": "Sal mineral. Inocua; aceptada en cosmética natural."
},
"SODIUM SULFATE": {
"severidad": "verde",
"categorias": [],
"nota": "Sal mineral. Inocua; aceptada en cosmética natural."
},
"POTASSIUM CHLORIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Sal mineral. Inocua; aceptada en cosmética natural."
},
"CALCIUM CHLORIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Sal mineral. Inocua; aceptada en cosmética natural."
},
"SEA SALT": {
"severidad": "verde",
"categorias": [],
"nota": "Sal mineral. Inocua; aceptada en cosmética natural."
},
"POTASSIUM NITRATE": {
"severidad": "verde",
"categorias": [],
"nota": "Sal mineral. Inocua; aceptada en cosmética natural."
},
"ZINC CHLORIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Sal mineral. Inocua; aceptada en cosmética natural."
},
"ZINC SULFATE": {
"severidad": "verde",
"categorias": [],
"nota": "Sal mineral. Inocua; aceptada en cosmética natural."
},
"ZINC CITRATE": {
"severidad": "verde",
"categorias": [],
"nota": "Sal mineral. Inocua; aceptada en cosmética natural."
},
"ZINC": {
"severidad": "verde",
"categorias": [],
"nota": "Sal mineral. Inocua; aceptada en cosmética natural."
},
"CALCIUM GLYCEROPHOSPHATE": {
"severidad": "verde",
"categorias": [],
"nota": "Sal mineral. Inocua; aceptada en cosmética natural."
},
"HYDRATED SILICA": {
"severidad": "verde",
"categorias": [],
"nota": "Mineral (textura, absorbente, color o pulido). Aceptado en cosmética natural."
},
"TIN OXIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Mineral (textura, absorbente, color o pulido). Aceptado en cosmética natural."
},
"ALUMINA": {
"severidad": "verde",
"categorias": [],
"nota": "Mineral (textura, absorbente, color o pulido). Aceptado en cosmética natural."
},
"ALUMINUM HYDROXIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Mineral (textura, absorbente, color o pulido). Aceptado en cosmética natural."
},
"PERLITE": {
"severidad": "verde",
"categorias": [],
"nota": "Mineral (textura, absorbente, color o pulido). Aceptado en cosmética natural."
},
"CALCIUM SILICATE": {
"severidad": "verde",
"categorias": [],
"nota": "Mineral (textura, absorbente, color o pulido). Aceptado en cosmética natural."
},
"MAGNESIUM CARBONATE HYDROXIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Mineral (textura, absorbente, color o pulido). Aceptado en cosmética natural."
},
"CALCIUM PYROPHOSPHATE": {
"severidad": "verde",
"categorias": [],
"nota": "Mineral (textura, absorbente, color o pulido). Aceptado en cosmética natural."
},
"CHARCOAL POWDER": {
"severidad": "verde",
"categorias": [],
"nota": "Mineral (textura, absorbente, color o pulido). Aceptado en cosmética natural."
},
"SYNTHETIC FLUORPHLOGOPITE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Mineral sintético (brillo o textura). Inocuo, pero no es natural."
},
"CALCIUM SODIUM BOROSILICATE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Mineral sintético (brillo o textura). Inocuo, pero no es natural."
},
"CALCIUM ALUMINUM BOROSILICATE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Mineral sintético (brillo o textura). Inocuo, pero no es natural."
},
"BORON NITRIDE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Mineral sintético (brillo o textura). Inocuo, pero no es natural."
},
"SODIUM FLUORIDE": {
"severidad": "amarillo",
"categorias": [],
"nota": "Flúor (dentífricos). Ayuda contra la caries, pero la cantidad importa: en niños, el exceso puede causar fluorosis dental. Revisa la concentración (ppm) y usa solo un poco, del tamaño de un guisante."
},
"SODIUM MONOFLUOROPHOSPHATE": {
"severidad": "amarillo",
"categorias": [],
"nota": "Flúor (dentífricos). Ayuda contra la caries, pero la cantidad importa: en niños, el exceso puede causar fluorosis dental. Revisa la concentración (ppm) y usa solo un poco, del tamaño de un guisante."
},
"STANNOUS FLUORIDE": {
"severidad": "amarillo",
"categorias": [],
"nota": "Flúor (dentífricos). Ayuda contra la caries, pero la cantidad importa: en niños, el exceso puede causar fluorosis dental. Revisa la concentración (ppm) y usa solo un poco, del tamaño de un guisante."
},
"STANNOUS CHLORIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Ingrediente de dentífricos (flúor o antisarro). Inocuo a las dosis permitidas."
},
"TETRAPOTASSIUM PYROPHOSPHATE": {
"severidad": "verde",
"categorias": [],
"nota": "Ingrediente de dentífricos (flúor o antisarro). Inocuo a las dosis permitidas."
},
"TETRASODIUM PYROPHOSPHATE": {
"severidad": "verde",
"categorias": [],
"nota": "Ingrediente de dentífricos (flúor o antisarro). Inocuo a las dosis permitidas."
},
"SODIUM HEXAMETAPHOSPHATE": {
"severidad": "verde",
"categorias": [],
"nota": "Ingrediente de dentífricos (flúor o antisarro). Inocuo a las dosis permitidas."
},
"SUCRALOSE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Edulcorante sintético (dentífricos). Inocuo, pero no es natural."
},
"POTASSIUM ACESULFAME": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Edulcorante sintético (dentífricos). Inocuo, pero no es natural."
},
"XYLITOL": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"MALTODEXTRIN": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"SUCROSE": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"MALTOSE": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"MANNOSE": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"XYLOSE": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"RHAMNOSE": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"INOSITOL": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"SACCHARIDE ISOMERATE": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"ALPHA-GLUCAN OLIGOSACCHARIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"HYDROGENATED STARCH HYDROLYSATE": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"ANHYDROXYLITOL": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"GLYCERYL GLUCOSIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"DIGLYCERIN": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"POLYGLYCERIN-10": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"CARAMEL": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"HYDROLYZED CORN STARCH": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"ARGININE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"GLYCINE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"HISTIDINE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"SERINE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"VALINE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"LYSINE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"ASPARTIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"ISOLEUCINE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"PHENYLALANINE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"GLUTAMIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"BIOTIN": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"CALCIUM PANTOTHENATE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"PANTOLACTONE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"ZINC PCA": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"CAFFEINE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"ASCORBYL PALMITATE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"PROPANEDIOL": {
"severidad": "verde",
"categorias": [],
"nota": "Humectante. Hoy casi siempre se obtiene del maíz por fermentación; aceptado en cosmética natural."
},
"SQUALENE": {
"severidad": "verde",
"categorias": [],
"nota": "Lípido presente en la propia piel; se obtiene de la oliva (o, raramente, de tiburón)."
},
"HYDROLYZED SODIUM HYALURONATE": {
"severidad": "verde",
"categorias": [],
"nota": "Ácido hialurónico fragmentado (biotecnológico). Hidratante; aceptado en cosmética natural."
},
"SODIUM ACETYLATED HYALURONATE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Ácido hialurónico modificado químicamente. Inocuo, pero no es natural."
},
"HYDROXYPROPYLTRIMONIUM HYALURONATE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Ácido hialurónico modificado con un grupo catiónico sintético. Inocuo, pero no es natural."
},
"CERAMIDE NP": {
"severidad": "verde",
"categorias": [],
"nota": "Lípido idéntico a los de la piel (barrera). Suele obtenerse por biotecnología."
},
"CERAMIDE AP": {
"severidad": "verde",
"categorias": [],
"nota": "Lípido idéntico a los de la piel (barrera). Suele obtenerse por biotecnología."
},
"CERAMIDE EOP": {
"severidad": "verde",
"categorias": [],
"nota": "Lípido idéntico a los de la piel (barrera). Suele obtenerse por biotecnología."
},
"PHYTOSPHINGOSINE": {
"severidad": "verde",
"categorias": [],
"nota": "Lípido idéntico a los de la piel (barrera). Suele obtenerse por biotecnología."
},
"CHOLESTEROL": {
"severidad": "verde",
"categorias": [],
"nota": "Lípido idéntico a los de la piel (barrera). Suele obtenerse por biotecnología."
},
"BETA-SITOSTEROL": {
"severidad": "verde",
"categorias": [],
"nota": "Fitoesterol de origen vegetal. Aceptado en cosmética natural."
},
"DIPOTASSIUM GLYCYRRHIZATE": {
"severidad": "verde",
"categorias": [],
"nota": "Derivado del regaliz, calmante. Aceptado en cosmética natural."
},
"HYDROLYZED JOJOBA ESTERS": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"SODIUM PALMATE": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"SODIUM PALM KERNELATE": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"SODIUM STEARATE": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"SODIUM LAURATE": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"SODIUM OLEATE": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"SODIUM PALMITATE": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"POTASSIUM OLIVATE": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"POTASSIUM SUNFLOWERSEEDATE": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"PALM ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"SOY ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"COCONUT ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"CAPRYLIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"CAPRIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"LAURIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"MYRISTIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"ARACHIDIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Jabón o ácido graso de origen vegetal. Aceptado en cosmética natural; los jabones pueden resecar pieles sensibles."
},
"GLYCERYL OLEATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"GLYCERYL STEARATE CITRATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"GLYCERYL OLEATE CITRATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"GLYCERYL LAURATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"GLYCERYL ISOSTEARATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"GLYCERYL STEARATE SE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"GLYCERYL LINOLEATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"GLYCERYL PALMITATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"GLYCERYL LINOLENATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"POLYGLYCERYL-3 CAPRYLATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"POLYGLYCERYL-3 METHYLGLUCOSE DISTEARATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"POLYGLYCERYL-6 STEARATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"POLYGLYCERYL-6 BEHENATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"POLYGLYCERYL-3 DIISOSTEARATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"POLYGLYCERYL-2 DIPOLYHYDROXYSTEARATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"POLYGLYCERYL-4 CAPRATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"POLYGLYCERYL-10 LAURATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"POLYGLYCERYL-10 STEARATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"POLYGLYCERYL-10 MYRISTATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"DIISOSTEAROYL POLYGLYCERYL-3 DIMER DILINOLEATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"OLEIC/LINOLEIC/LINOLENIC POLYGLYCERIDES": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"HYDROGENATED PALM GLYCERIDES CITRATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"HYDROGENATED COCO-GLYCERIDES": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"HYDROGENATED VEGETABLE GLYCERIDES": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"C10-18 TRIGLYCERIDES": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"TRIBEHENIN": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"TRIHYDROXYSTEARIN": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"SORBITAN STEARATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"SORBITAN ISOSTEARATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"SORBITAN CAPRYLATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"SORBITAN LAURATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"SUCROSE STEARATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"CETYL PALMITATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"CETYL ESTERS": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"DECYL OLEATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"LAURYL OLEATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"HEXYL LAURATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"OLEYL ERUCATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"COCO CAPRYLATE/CAPRATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"DICAPRYLYL CARBONATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"C15-19 ALKANE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"POTASSIUM CETYL PHOSPHATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"SODIUM CETEARYL SULFATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"BEHENYL ALCOHOL": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"MYRISTYL ALCOHOL": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"ARACHIDYL ALCOHOL": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"C20-22 ALCOHOLS": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"ZINC RICINOLEATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"TRIETHYL CITRATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"COCO-GLUCOSIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"ARACHIDYL GLUCOSIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"XYLITYLGLUCOSIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"COCO-BETAINE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"SODIUM LAUROYL LACTYLATE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"SODIUM STEAROYL GLUTAMATE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"DISODIUM STEAROYL GLUTAMATE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"SODIUM LAUROYL SARCOSINATE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"SODIUM METHYL COCOYL TAURATE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"SODIUM ISETHIONATE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"SODIUM LAUROYL ISETHIONATE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"DISODIUM COCOAMPHODIACETATE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"DISODIUM COCAMPHODIACETATE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"SODIUM LAUROAMPHOACETATE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"CELLULOSE GUM": {
"severidad": "verde",
"categorias": [],
"nota": "Espesante de origen natural (gomas, almidones, celulosa). Aceptado en cosmética natural."
},
"ALGIN": {
"severidad": "verde",
"categorias": [],
"nota": "Espesante de origen natural (gomas, almidones, celulosa). Aceptado en cosmética natural."
},
"SCLEROTIUM GUM": {
"severidad": "verde",
"categorias": [],
"nota": "Espesante de origen natural (gomas, almidones, celulosa). Aceptado en cosmética natural."
},
"GELLAN GUM": {
"severidad": "verde",
"categorias": [],
"nota": "Espesante de origen natural (gomas, almidones, celulosa). Aceptado en cosmética natural."
},
"ZEA MAYS STARCH": {
"severidad": "verde",
"categorias": [],
"nota": "Espesante de origen natural (gomas, almidones, celulosa). Aceptado en cosmética natural."
},
"ORYZA SATIVA STARCH": {
"severidad": "verde",
"categorias": [],
"nota": "Espesante de origen natural (gomas, almidones, celulosa). Aceptado en cosmética natural."
},
"TAPIOCA STARCH": {
"severidad": "verde",
"categorias": [],
"nota": "Espesante de origen natural (gomas, almidones, celulosa). Aceptado en cosmética natural."
},
"TRITICUM VULGARE GLUTEN": {
"severidad": "verde",
"categorias": [],
"nota": "Espesante de origen natural (gomas, almidones, celulosa). Aceptado en cosmética natural."
},
"GUAR HYDROXYPROPYLTRIMONIUM CHLORIDE": {
"severidad": "verde",
"categorias": [],
"nota": "Espesante de origen natural (gomas, almidones, celulosa). Aceptado en cosmética natural."
},
"ALUMINUM STARCH OCTENYLSUCCINATE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Almidón modificado químicamente con un reactivo sintético. Inocuo, pero no es natural."
},
"HYDROXYPROPYL STARCH PHOSPHATE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Almidón modificado químicamente con un reactivo sintético. Inocuo, pero no es natural."
},
"BENZOIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Conservante permitido en cosmética natural certificada."
},
"SORBIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Conservante permitido en cosmética natural certificada."
},
"DEHYDROACETIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Conservante permitido en cosmética natural certificada."
},
"SODIUM DEHYDROACETATE": {
"severidad": "verde",
"categorias": [],
"nota": "Conservante permitido en cosmética natural certificada."
},
"PHENETHYL ALCOHOL": {
"severidad": "verde",
"categorias": [],
"nota": "Conservante permitido en cosmética natural certificada."
},
"LEVULINIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Conservante permitido en cosmética natural certificada."
},
"P-ANISIC ACID": {
"severidad": "verde",
"categorias": [],
"nota": "Conservante permitido en cosmética natural certificada."
},
"TETRASODIUM GLUTAMATE DIACETATE": {
"severidad": "verde",
"categorias": [],
"nota": "Quelante biodegradable (ayuda a conservar). Aceptado en cosmética natural."
},
"TRISODIUM ETHYLENEDIAMINE DISUCCINATE": {
"severidad": "verde",
"categorias": [],
"nota": "Quelante biodegradable (ayuda a conservar). Aceptado en cosmética natural."
},
"SODIUM PHYTATE": {
"severidad": "verde",
"categorias": [],
"nota": "Quelante biodegradable (ayuda a conservar). Aceptado en cosmética natural."
},
"TETRASODIUM ETIDRONATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Quelante sintético (fosfonato). Poco biodegradable."
},
"ETIDRONIC ACID": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Quelante sintético (fosfonato). Poco biodegradable."
},
"EDTA": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Quelante sintético, muy poco biodegradable."
},
"CAPRYLHYDROXAMIC ACID": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Conservante/quelante de síntesis. Inocuo, pero no se acepta en cosmética natural."
},
"METHYLPROPANEDIOL": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"HYDROXYETHYL UREA": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Humectante sintético derivado de la urea. Inocuo, pero no es natural."
},
"FORMIC ACID": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Ácido conservante. Puede irritar; no se usa en cosmética natural."
},
"SODIUM METABISULFITE": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Sulfito (antioxidante). Puede dar reacciones en personas sensibles a sulfitos."
},
"SODIUM SULFITE": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Sulfito (antioxidante). Puede dar reacciones en personas sensibles a sulfitos."
},
"SODIUM SALICYLATE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Conservante de la familia de los salicilatos. Autorizado con límites; no es natural.",
"lactancia": "precaucion"
},
"PIROCTONE OLAMINE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Anticaspa sintético. Eficaz e inocuo a las dosis permitidas, pero no es natural."
},
"CETYLPYRIDINIUM CHLORIDE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Antiséptico sintético (colutorios, dentífricos). Inocuo a dosis permitidas, pero no es natural."
},
"ZINC NEODECANOATE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Sal de zinc sintética (desodorantes). Inocua, pero no es natural."
},
"METHYLCHLOROISOTHIAZOLINONE METHYLISOTHIAZOLINONE": {
"severidad": "rojo",
"categorias": [
"conservante_controvertido"
],
"nota": "Mezcla de isotiazolinonas: conservante muy alergénico, prohibido en productos sin aclarado en la UE."
},
"ALUMINIUM CHLOROHYDRATE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Sal de aluminio antitranspirante. La UE la considera segura dentro de sus límites, pero bloquea el sudor."
},
"SODIUM C14-16 OLEFIN SULFONATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Limpiador sintético de origen petroquímico. Puede resecar o irritar; no entra en GAROA."
},
"SODIUM XYLENESULFONATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Limpiador sintético de origen petroquímico. Puede resecar o irritar; no entra en GAROA."
},
"TEA-DODECYLBENZENESULFONATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Limpiador sintético de origen petroquímico. Puede resecar o irritar; no entra en GAROA."
},
"COCAMIDOPROPYL HYDROXYSULTAINE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Limpiador sintético de origen petroquímico. Puede resecar o irritar; no entra en GAROA."
},
"COCAMIDOPROPYLAMINE OXIDE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Limpiador sintético de origen petroquímico. Puede resecar o irritar; no entra en GAROA."
},
"COCAMIDE MEA": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Limpiador sintético de origen petroquímico. Puede resecar o irritar; no entra en GAROA."
},
"COCAMIDE MIPA": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Limpiador sintético de origen petroquímico. Puede resecar o irritar; no entra en GAROA."
},
"POLOXAMINE 1307": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Limpiador sintético de origen petroquímico. Puede resecar o irritar; no entra en GAROA."
},
"TEA-LAURYL SULFATE": {
"severidad": "amarillo",
"categorias": [
"sulfato"
],
"nota": "Sulfato limpiador muy detergente. Puede resecar e irritar."
},
"SODIUM COCO-SULFATE": {
"severidad": "amarillo",
"categorias": [
"sulfato"
],
"nota": "Sulfato de origen coco, rico en laurilsulfato. Puede resecar e irritar."
},
"COCAMIDE DEA": {
"severidad": "rojo",
"categorias": [],
"nota": "Espumante clasificado por la IARC como posible cancerígeno (grupo 2B)."
},
"TRIETHANOLAMINE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Regulador del pH sintético. Puede formar nitrosaminas si se mezcla con ciertos ingredientes; está regulado en la UE."
},
"AMINOMETHYL PROPANOL": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"CETRIMONIUM CHLORIDE": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Acondicionador catiónico sintético. Puede irritar pieles sensibles."
},
"CETRIMONIUM BROMIDE": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Acondicionador catiónico sintético. Puede irritar pieles sensibles."
},
"BEHENTRIMONIUM CHLORIDE": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Acondicionador catiónico sintético. Puede irritar pieles sensibles."
},
"BEHENTRIMONIUM METHOSULFATE": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Acondicionador catiónico sintético. Puede irritar pieles sensibles."
},
"PALMITAMIDOPROPYLTRIMONIUM CHLORIDE": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Acondicionador catiónico sintético. Puede irritar pieles sensibles."
},
"DISTEAROYLETHYL DIMONIUM CHLORIDE": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Acondicionador catiónico sintético. Puede irritar pieles sensibles."
},
"DIPALMITOYLETHYL HYDROXYETHYLMONIUM METHOSULFATE": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Acondicionador catiónico sintético. Puede irritar pieles sensibles."
},
"STEARAMIDOPROPYL DIMETHYLAMINE": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Acondicionador catiónico sintético. Puede irritar pieles sensibles."
},
"STEARAMIDE AMP": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Acondicionador catiónico sintético. Puede irritar pieles sensibles."
},
"GLYCOL DISTEARATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"GLYCOL STEARATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"GLYCOL": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"DIPROPYLENE GLYCOL": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"TRIETHYLENE GLYCOL": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"HEXYLENE GLYCOL": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"C12-15 ALKYL BENZOATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"DIBUTYL ADIPATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"DIISOPROPYL ADIPATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"DIISOPROPYL SEBACATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"CETEARYL ETHYLHEXANOATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"ETHYLHEXYL STEARATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"ISODECYL NEOPENTANOATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"PENTAERYTHRITYL TETRAETHYLHEXANOATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"PENTAERYTHRITYL DISTEARATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"HYDROGENATED ETHYLHEXYL OLIVATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"BUTYLENE GLYCOL DICAPRYLATE/DICAPRATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"BIS-DIGLYCERYL POLYACYLADIPATE-2": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"TRIS CITRATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"ISOPENTANE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"BUTYL ACETATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"ETHYL ACETATE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Disolvente (quitaesmaltes, esmaltes). Puede resecar uñas y piel."
},
"ALCOHOL": {
"severidad": "amarillo",
"categorias": [
"alcohol_desecante"
],
"nota": "Alcohol etílico. En concentración alta reseca e irrita; en poca cantidad ayuda a disolver o conservar."
},
"PENTAERYTHRITYL TETRA-DI-T-BUTYL HYDROXYHYDROCINNAMATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Antioxidante sintético para proteger la fórmula. Inocuo a estas dosis, pero de origen petroquímico."
},
"OCTADECYL DI-T-BUTYL-4-HYDROXYHYDROCINNAMATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Antioxidante sintético para proteger la fórmula. Inocuo a estas dosis, pero de origen petroquímico."
},
"BENZOTRIAZOLYL DODECYL P-CRESOL": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Antioxidante sintético para proteger la fórmula. Inocuo a estas dosis, pero de origen petroquímico."
},
"SILICA SILYLATE": {
"severidad": "amarillo",
"categorias": [
"silicona"
],
"nota": "Sílice tratada con silicona. No entra en GAROA."
},
"SILICA DIMETHYL SILYLATE": {
"severidad": "amarillo",
"categorias": [
"silicona"
],
"nota": "Sílice tratada con silicona. No entra en GAROA."
},
"ALUMINUM STEARATES": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Sal de aluminio de ácidos grasos (espesante de maquillaje). Inocua, no natural."
},
"BUTYL METHOXYDIBENZOYLMETHANE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Filtro solar sintético. Autorizado en la UE con límites; no se acepta en cosmética natural."
},
"ETHYLHEXYL SALICYLATE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Filtro solar sintético. Autorizado en la UE con límites; no se acepta en cosmética natural."
},
"ETHYLHEXYL TRIAZONE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Filtro solar sintético. Autorizado en la UE con límites; no se acepta en cosmética natural."
},
"BIS-ETHYLHEXYLOXYPHENOL METHOXYPHENYL TRIAZINE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Filtro solar sintético. Autorizado en la UE con límites; no se acepta en cosmética natural."
},
"DIETHYLAMINO HYDROXYBENZOYL HEXYL BENZOATE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Filtro solar sintético. Autorizado en la UE con límites; no se acepta en cosmética natural."
},
"DIETHYLHEXYL BUTAMIDO TRIAZONE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Filtro solar sintético. Autorizado en la UE con límites; no se acepta en cosmética natural."
},
"PHENYLBENZIMIDAZOLE SULFONIC ACID": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Filtro solar sintético. Autorizado en la UE con límites; no se acepta en cosmética natural."
},
"PALMITOYL TRIPEPTIDE-1": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Péptido de síntesis. Autorizado, pero no es un ingrediente natural."
},
"PALMITOYL TETRAPEPTIDE-7": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Péptido de síntesis. Autorizado, pero no es un ingrediente natural."
},
"ACETYL HEXAPEPTIDE-8": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Péptido de síntesis. Autorizado, pero no es un ingrediente natural."
},
"CAPRYLOYL SALICYLIC ACID": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Exfoliante sintético derivado del ácido salicílico. Puede irritar; no es natural.",
"lactancia": "precaucion"
},
"HYDROLYZED KERATIN": {
"severidad": "verde",
"categorias": [],
"nota": "Ingrediente de origen animal. Inocuo; tenlo en cuenta si buscas cosmética vegana."
},
"HYDROLYZED MILK PROTEIN": {
"severidad": "verde",
"categorias": [],
"nota": "Ingrediente de origen animal. Inocuo; tenlo en cuenta si buscas cosmética vegana."
},
"HYDROLYZED ELASTIN": {
"severidad": "verde",
"categorias": [],
"nota": "Ingrediente de origen animal. Inocuo; tenlo en cuenta si buscas cosmética vegana."
},
"LANOLIN ALCOHOL": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Derivado de la lana de oveja. Muy nutritivo, pero es un alérgeno de contacto conocido."
},
"LINALYL ACETATE": {
"severidad": "verde",
"categorias": [
"fragrance_ae"
],
"nota": "Componente de aceites esenciales. Si va declarado, es porque puede dar alergia en pieles sensibles; también puede ser de síntesis."
},
"ANETHOLE": {
"severidad": "verde",
"categorias": [
"fragrance_ae"
],
"nota": "Componente de aceites esenciales. Si va declarado, es porque puede dar alergia en pieles sensibles; también puede ser de síntesis."
},
"PINENE": {
"severidad": "verde",
"categorias": [
"fragrance_ae"
],
"nota": "Componente de aceites esenciales. Si va declarado, es porque puede dar alergia en pieles sensibles; también puede ser de síntesis."
},
"CARVONE": {
"severidad": "verde",
"categorias": [
"fragrance_ae"
],
"nota": "Componente de aceites esenciales. Si va declarado, es porque puede dar alergia en pieles sensibles; también puede ser de síntesis."
},
"TERPINEOL": {
"severidad": "verde",
"categorias": [
"fragrance_ae"
],
"nota": "Componente de aceites esenciales. Si va declarado, es porque puede dar alergia en pieles sensibles; también puede ser de síntesis."
},
"GERANYL ACETATE": {
"severidad": "verde",
"categorias": [
"fragrance_ae"
],
"nota": "Componente de aceites esenciales. Si va declarado, es porque puede dar alergia en pieles sensibles; también puede ser de síntesis."
},
"BETA-CARYOPHYLLENE": {
"severidad": "verde",
"categorias": [
"fragrance_ae"
],
"nota": "Componente de aceites esenciales. Si va declarado, es porque puede dar alergia en pieles sensibles; también puede ser de síntesis."
},
"EUCALYPTOL": {
"severidad": "verde",
"categorias": [
"fragrance_ae"
],
"nota": "Componente de aceites esenciales. Si va declarado, es porque puede dar alergia en pieles sensibles; también puede ser de síntesis."
},
"THYMOL": {
"severidad": "verde",
"categorias": [
"fragrance_ae"
],
"nota": "Componente de aceites esenciales. Si va declarado, es porque puede dar alergia en pieles sensibles; también puede ser de síntesis."
},
"D-LIMONENE": {
"severidad": "verde",
"categorias": [
"fragrance_ae"
],
"nota": "Componente de aceites esenciales. Si va declarado, es porque puede dar alergia en pieles sensibles; también puede ser de síntesis."
},
"VANILLIN": {
"severidad": "verde",
"categorias": [
"fragrance_ae"
],
"nota": "Componente de aceites esenciales. Si va declarado, es porque puede dar alergia en pieles sensibles; también puede ser de síntesis."
},
"BENZALDEHYDE": {
"severidad": "verde",
"categorias": [
"fragrance_ae"
],
"nota": "Componente de aceites esenciales. Si va declarado, es porque puede dar alergia en pieles sensibles; también puede ser de síntesis."
},
"CAMPHOR": {
"severidad": "amarillo",
"categorias": [
"fragrance_ae"
],
"nota": "Alcanfor. Refrescante, pero puede irritar; evitar en bebés y con precaución en embarazo y lactancia.",
"lactancia": "precaucion"
},
"METHYL SALICYLATE": {
"severidad": "amarillo",
"categorias": [
"fragrance_ae"
],
"nota": "Salicilato de metilo (aroma a gaulteria). Puede irritar; precaución en embarazo y lactancia.",
"lactancia": "precaucion"
},
"TETRAMETHYL ACETYLOCTAHYDRONAPHTHALENES": {
"severidad": "amarillo",
"categorias": [
"fragrance_sintetica"
],
"nota": "Molécula aromática de síntesis. Inocua a dosis cosméticas, pero no es natural; algunas sensibilizan."
},
"ROSE KETONES": {
"severidad": "amarillo",
"categorias": [
"fragrance_sintetica"
],
"nota": "Molécula aromática de síntesis. Inocua a dosis cosméticas, pero no es natural; algunas sensibilizan."
},
"DIMETHYL PHENETHYL ACETATE": {
"severidad": "amarillo",
"categorias": [
"fragrance_sintetica"
],
"nota": "Molécula aromática de síntesis. Inocua a dosis cosméticas, pero no es natural; algunas sensibilizan."
},
"ACETYL CEDRENE": {
"severidad": "amarillo",
"categorias": [
"fragrance_sintetica"
],
"nota": "Molécula aromática de síntesis. Inocua a dosis cosméticas, pero no es natural; algunas sensibilizan."
},
"AMYL SALICYLATE": {
"severidad": "amarillo",
"categorias": [
"fragrance_sintetica"
],
"nota": "Molécula aromática de síntesis. Inocua a dosis cosméticas, pero no es natural; algunas sensibilizan."
},
"ISOEUGENYL ACETATE": {
"severidad": "amarillo",
"categorias": [
"fragrance_sintetica"
],
"nota": "Molécula aromática de síntesis. Inocua a dosis cosméticas, pero no es natural; algunas sensibilizan."
},
"HEXAMETHYLINDANOPYRAN": {
"severidad": "amarillo",
"categorias": [
"fragrance_sintetica"
],
"nota": "Almizcle sintético (galaxolida). Persistente y se acumula en el medio ambiente."
},
"HECTORITE": {
"severidad": "verde",
"categorias": [],
"nota": "Mineral (textura, absorbente, color o pulido). Aceptado en cosmética natural."
},
"ALUMINUM SILICATE": {
"severidad": "verde",
"categorias": [],
"nota": "Mineral (textura, absorbente, color o pulido). Aceptado en cosmética natural."
},
"DICALCIUM PHOSPHATE DIHYDRATE": {
"severidad": "verde",
"categorias": [],
"nota": "Ingrediente de dentífricos (flúor o antisarro). Inocuo a las dosis permitidas."
},
"SODIUM METAPHOSPHATE": {
"severidad": "verde",
"categorias": [],
"nota": "Ingrediente de dentífricos (flúor o antisarro). Inocuo a las dosis permitidas."
},
"PENTASODIUM TRIPHOSPHATE": {
"severidad": "verde",
"categorias": [],
"nota": "Regulador del pH o sal de uso habitual. Inocuo y aceptado en cosmética natural."
},
"THREONINE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"ALANINE": {
"severidad": "verde",
"categorias": [],
"nota": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural."
},
"MANNITOL": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"FRUCTOOLIGOSACCHARIDES": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"GALACTOARABINAN": {
"severidad": "verde",
"categorias": [],
"nota": "Espesante de origen natural (gomas, almidones, celulosa). Aceptado en cosmética natural."
},
"ACACIA SENEGAL GUM": {
"severidad": "verde",
"categorias": [],
"nota": "Espesante de origen natural (gomas, almidones, celulosa). Aceptado en cosmética natural."
},
"CYCLODEXTRIN": {
"severidad": "verde",
"categorias": [],
"nota": "Azúcar o derivado vegetal. Hidrata y suaviza; aceptado en cosmética natural."
},
"HYDROLYZED CORN PROTEIN": {
"severidad": "verde",
"categorias": [],
"nota": "Proteína vegetal hidrolizada. Hidrata y suaviza; aceptada en cosmética natural."
},
"PHOSPHATIDYLCHOLINE": {
"severidad": "verde",
"categorias": [],
"nota": "Lecitina (fosfolípido vegetal). Aceptada en cosmética natural."
},
"SODIUM CHOLATE": {
"severidad": "verde",
"categorias": [],
"nota": "Ingrediente de origen animal. Inocuo; tenlo en cuenta si buscas cosmética vegana."
},
"SORBITAN TRISTEARATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"CETYL ACETATE": {
"severidad": "verde",
"categorias": [],
"nota": "Emulsionante o emoliente de origen vegetal (aceites y azúcares). Aceptado en cosmética natural."
},
"BUTYLOCTANOL": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Ingrediente sintético de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA."
},
"SODIUM LAURYL GLUCOSE CARBOXYLATE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"SODIUM LAUROYL METHYL ISETHIONATE": {
"severidad": "verde",
"categorias": [],
"nota": "Limpiador suave de origen vegetal. Aceptado en cosmética natural."
},
"DISODIUM LAURYL SULFOSUCCINATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Limpiador sintético de origen petroquímico. Puede resecar o irritar; no entra en GAROA."
},
"ZINC COCETH SULFATE": {
"severidad": "amarillo",
"categorias": [
"sulfato"
],
"nota": "Sulfato etoxilado. Puede resecar; de origen petroquímico en parte. No entra en GAROA."
},
"HYDROXYPROPYL GUAR HYDROXYPROPYLTRIMONIUM CHLORIDE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Goma guar modificada con grupos sintéticos. Inocua, pero no es natural."
},
"CAPRYLOYL GLYCINE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Activo sintético (piel grasa). Inocuo, pero no es natural."
},
"2-OLEAMIDO-1,3-OCTADECANEDIOL": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Ceramida de síntesis. Inocua, pero no es natural."
},
"ACETYLATED LANOLIN ALCOHOL": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Derivado de la lanolina modificado. Puede ser alergénico y comedogénico."
},
"PROPYL GALLATE": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Antioxidante sintético. Puede dar alergia de contacto."
},
"DIETHYLHEXYL SYRINGYLIDENEMALONATE": {
"severidad": "amarillo",
"categorias": [
"petroquimico"
],
"nota": "Fotoestabilizante sintético para filtros solares. De origen petroquímico."
},
"CHLORHEXIDINE DIGLUCONATE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Antiséptico sintético. Inocuo a las dosis permitidas, pero puede irritar y no es natural."
},
"BENZALKONIUM CHLORIDE": {
"severidad": "amarillo",
"categorias": [
"irritante"
],
"nota": "Antiséptico/conservante catiónico. Irritante y sensibilizante."
},
"CLIMBAZOLE": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Anticaspa sintético. Autorizado con límites; no es natural."
},
"PHENYLPROPANOL": {
"severidad": "amarillo",
"categorias": [
"no_cosmetica_natural"
],
"nota": "Potenciador de conservantes de síntesis. Inocuo, pero no es natural."
},
"2-METHYL 5-CYCLOHEXYLPENTANOL": {
"severidad": "amarillo",
"categorias": [
"fragrance_sintetica"
],
"nota": "Molécula aromática de síntesis. Inocua a dosis cosméticas, pero no es natural; algunas sensibilizan."
}
};
const ALIAS_EXTRA = {"2-HEXANEDIOL": "1,2-HEXANEDIOL", "CAMPHRE": "CAMPHOR", "PARFUMS": "PARFUM", "ALPHA ISOMETHYL IONONE": "ALPHA-ISOMETHYL IONONE", "ETHYLHEXYGLYCERIN": "ETHYLHEXYLGLYCERIN", "LIMONENE D": "D-LIMONENE", "CERA MICROCRISTALLINA": "MICROCRYSTALLINE WAX", "ALUMINUM CHLOROHYDRATE": "ALUMINIUM CHLOROHYDRATE", "ACETYLCEDRENE": "ACETYL CEDRENE", "ALPHA-ISOMETHYL LONONE": "ALPHA-ISOMETHYL IONONE", "ROSE KETONE": "ROSE KETONES", "UNALOOL": "LINALOOL", "BUTYPHENYL METHYLPROPIONAL": "BUTYLPHENYL METHYLPROPIONAL", "PARAFINIUM LIQUIDIUM": "PARAFFINUM LIQUIDUM", "EAU": "AQUA", "AGUA": "AQUA", "GLICERINA": "GLYCERIN", "COCO-CAPRYLATE CAPRATE": "COCO-CAPRYLATE/CAPRATE", "SODIUM 14-16 OLEFIN SULFONATE": "SODIUM C14-16 OLEFIN SULFONATE"};
const CAMBIOS_DB = {"PARFUM": ["amarillo", "Mezcla de aromas que no se declara (puede llevar decenas de moléculas sintéticas). Es la principal causa de alergia a cosméticos."], "POLYETHYLENE": ["amarillo", "Plástico (polietileno) usado como exfoliante o para dar textura. Inocuo para la piel, pero es un microplástico que acaba en el agua."], "ALUMINUM CHLORIDE": ["amarillo", "Sal de aluminio antitranspirante. La UE la considera segura dentro de sus límites, pero bloquea el sudor."], "SODIUM LAURYL SULFATE": ["amarillo", "Sulfato limpiador muy detergente. Irritante, sobre todo en pieles sensibles o con la barrera alterada."]};
Object.entries(CAMBIOS_DB).forEach(([k, [sev, nota]]) => { if (INCI_DB[k]) { INCI_DB[k].severidad = sev; INCI_DB[k].nota = nota; } });
Object.entries(DB_EXTRA).forEach(([k, v]) => { INCI_DB[k] = v; });
Object.entries(ALIAS_EXTRA).forEach(([k, v]) => { if (!INCI_DB[k]) INCI_DB[k] = { alias: v }; });

// ══════════════════════════════════════════════════════════════════════════════
// Ampliación 16/11/2026 (v2: notas con certificación y origen) — apuntes curso formulación (Aventura Cosmética, U1–U6 + sesiones de dudas)
// Mismo criterio de color: 🟢 natural o aceptado en cosmética natural certificada · 🟡 inocuo pero
// sintético o con matiz · 🔴 petroquímico o posible riesgo para la salud.
// Campos nuevos: funcion (para qué está en la fórmula) y pct (uso habitual), solo con dato del curso
// o de fuente citada en «Revisión INCI - cambios propuestos v1.html».
// ══════════════════════════════════════════════════════════════════════════════
const DB_APUNTES = {
 "CISTUS LADANIFERUS OIL": {
  "nombre_com": "Aceite esencial de jara (ládano)",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "verde",
  "nota": "Aceite esencial de jara, de aroma ambarado y resinoso. Aporta aroma; como todo aceite esencial lleva componentes que pueden sensibilizar, más si está oxidado (guardar en frío y sin aire).",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "aroma"
 },
 "CITRUS AURANTIUM AMARA LEAF/TWIG OIL": {
  "nombre_com": "Aceite esencial de petitgrain",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "verde",
  "nota": "Aceite esencial destilado de hoja y ramita de naranjo amargo. Rico en acetato de linalilo y linalol, que al oxidarse forman hidroperóxidos sensibilizantes. Al ser destilado y de hoja, no es fototóxico (las furocumarinas están en la cáscara exprimida).",
  "lactancia": "ok",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "aroma"
 },
 "CUPRESSUS SEMPERVIRENS OIL": {
  "nombre_com": "Aceite esencial de ciprés",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "verde",
  "nota": "Aceite esencial de ciprés, rico en α-pineno. Aporta aroma; los terpenos oxidados sensibilizan, así que importa que el aceite sea fresco y lleve antioxidante. Su fama de «venotónico» procede de la tradición, sin ensayos tópicos sólidos.",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "aroma"
 },
 "LAURUS NOBILIS LEAF OIL": {
  "nombre_com": "Aceite esencial de hoja de laurel",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "verde",
  "nota": "Aceite esencial de hoja de laurel (rico en 1,8-cineol y eugenol en pequeña cantidad). Está permitido, con su cálculo de alérgenos e IFRA. No confundir con el aceite de semilla de laurel, que sí está prohibido.",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "aroma"
 },
 "LAURUS NOBILIS SEED OIL": {
  "nombre_com": "Aceite de semilla de laurel",
  "categorias": [
   "irritante"
  ],
  "severidad": "rojo",
  "nota": "Aceite de las semillas de laurel: prohibido en cosméticos en la UE (Anexo II del Reg. 1223/2009) por ser un sensibilizante potente. Si aparece en un producto vendido en la UE, ese producto no cumple la ley. Lo que sí se permite es el aceite esencial de la hoja.",
  "lactancia": "evitar",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ]
 },
 "JASMINUM GRANDIFLORUM FLOWER EXTRACT": {
  "nombre_com": "Absoluto de jazmín",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "verde",
  "nota": "El «aceite esencial» de jazmín es en realidad un absoluto: se extrae con disolvente (concreto, casi siempre con hexano) y se lava con etanol. Aroma floral intenso; lleva alérgenos de declaración obligatoria (alcohol bencílico, benzoato de bencilo, linalol…). Si buscas nada petroquímico, pregunta al proveedor con qué se extrajo.",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "aroma (absoluto)"
 },
 "ROSA DAMASCENA FLOWER CERA": {
  "nombre_com": "Cera floral de rosa",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "verde",
  "nota": "Cera floral: lo que queda del concreto de rosa al separar el absoluto. Da textura y aroma a bálsamos. El concreto se obtiene casi siempre con hexano; además lleva alérgenos de fragancia (geraniol, citronelol…) que se declaran por encima de 0,001 % (sin aclarado).",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "textura y aroma en bálsamos"
 },
 "MYROXYLON PEREIRAE RESIN": {
  "nombre_com": "Bálsamo del Perú",
  "categorias": [
   "fragrance_ae",
   "irritante"
  ],
  "severidad": "amarillo",
  "nota": "Bálsamo del Perú. Es un alérgeno clásico: el bálsamo crudo está prohibido como ingrediente de fragancia (Anexo II) y sus extractos y destilados están limitados por IFRA. Natural, pero de los más sensibilizantes. COSMOS aprueba el aceite destilado (Myroxylon Pereirae Oil), no la resina cruda.",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible",
   "rosácea"
  ],
  "funcion": "aroma, fijador"
 },
 "FICUS CARICA LEAF EXTRACT": {
  "nombre_com": "Extracto de hoja de higuera",
  "categorias": [
   "fragrance_ae",
   "irritante"
  ],
  "severidad": "amarillo",
  "nota": "La hoja de higuera tiene furocumarinas (psoralenos) fototóxicas: con sol pueden dar quemadura y manchas. El absoluto de hoja de higuera está prohibido como fragancia (Anexo II). Un extracto para cuidado de la piel debe venir libre de furocumarinas: pedir el certificado. COSMOS aprueba extractos de fruto de higuera (y algún fruto/hoja); comprueba el sello del producto.",
  "afecciones_relevantes": [
   "manchas",
   "piel_sensible"
  ],
  "funcion": "aroma o extracto vegetal"
 },
 "CARVACROL": {
  "nombre_com": "Carvacrol",
  "categorias": [
   "irritante"
  ],
  "severidad": "verde",
  "nota": "Fenol aromático de los aceites esenciales de orégano y tomillo. Antioxidante y antimicrobiano, pero dermocáustico a concentración alta: estos aceites se usan a dosis muy bajas en productos sin aclarado.",
  "afecciones_relevantes": [
   "piel_sensible",
   "dermatitis"
  ],
  "funcion": "aroma; antimicrobiano"
 },
 "LINOLENIC ACID": {
  "nombre_com": "Ácido α-linolénico (omega-3)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Ácido graso esencial omega-3 (junto al linoleico, los únicos esenciales). Forma parte de los aceites de lino, rosa mosqueta o cáñamo. Muy oxidable (tres dobles enlaces): pide antioxidante en la fórmula.",
  "lactancia": "ok",
  "funcion": "emoliente; lípido de barrera"
 },
 "SEA WATER": {
  "nombre_com": "Agua de mar",
  "categorias": [],
  "severidad": "verde",
  "nota": "Agua de mar filtrada: aporta sales minerales (sodio, magnesio, calcio). Sirve como base acuosa con sales; las propiedades «remineralizantes» proceden sobre todo de estudios de proveedor. Las sales pueden desestabilizar algunos emulsionantes y gomas.",
  "lactancia": "ok",
  "funcion": "base acuosa con sales minerales"
 },
 "ORYZA SATIVA BRAN CERA": {
  "nombre_com": "Cera de salvado de arroz",
  "categorias": [],
  "severidad": "verde",
  "nota": "Cera vegetal del salvado de arroz, dura y densa (funde hacia 75–85 °C). Da cuerpo y dureza a bálsamos y barras; poco oclusiva y bastante emoliente. Alternativa vegana a la cera de abeja.",
  "lactancia": "ok",
  "funcion": "dureza y textura (fase oleosa)"
 },
 "POLYGLYCERYL-3 BEESWAX": {
  "nombre_com": "Cera bellina (cera de abeja + poliglicerina)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Cera de abeja esterificada con poliglicerina (de glicerina vegetal): queda parcialmente hidrosoluble. Coemulsionante, gelifica aceites, ayuda a dispersar aceites esenciales y da bálsamos labiales blandos (mejor en tarro que en barra). No vegana.",
  "lactancia": "ok",
  "funcion": "coemulsionante; gelificante de aceites",
  "pct": "1–2 % (coemulsionante) · hasta 20 % (bálsamos)"
 },
 "SHELLAC": {
  "nombre_com": "Goma laca",
  "categorias": [],
  "severidad": "verde",
  "nota": "Resina segregada por un insecto (Kerria lacca). Forma película: se usa en lacas de uñas, máscaras de pestañas y fijadores. Natural, de origen animal (no vegana).",
  "lactancia": "ok",
  "funcion": "filmógeno"
 },
 "CYAMOPSIS TETRAGONOLOBA GUM": {
  "nombre_com": "Goma guar",
  "categorias": [],
  "severidad": "verde",
  "nota": "Polisacárido (galactomanano) de la semilla de guar. Espesante muy usado en champús, geles y cremas; sola es algo pegajosa, por eso se combina con xantana o alginato. Se dispersa en frío humectándola antes con glicerina.",
  "lactancia": "ok",
  "funcion": "espesante, gelificante"
 },
 "ASTRAGALUS GUMMIFER GUM": {
  "nombre_com": "Goma tragacanto",
  "categorias": [],
  "severidad": "verde",
  "nota": "Exudado de la planta Astragalus gummifer. Espesante y estabilizante en geles, lociones y acondicionadores. Fluye con facilidad.",
  "lactancia": "ok",
  "funcion": "espesante, estabilizante"
 },
 "CAESALPINIA SPINOSA GUM": {
  "nombre_com": "Goma tara",
  "categorias": [],
  "severidad": "verde",
  "nota": "Galactomanano de la semilla de tara. Espesante y, sobre todo, activo hidratante filmógeno. Menos habitual que la guar.",
  "lactancia": "ok",
  "funcion": "hidratante filmógeno; espesante"
 },
 "CERATONIA SILIQUA GUM": {
  "nombre_com": "Goma garrofín (algarrobo)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Galactomanano de la semilla de algarrobo. Espesante, y más usado como activo hidratante (se hincha y forma película, alternativa vegetal al hialurónico aunque retiene menos agua).",
  "lactancia": "ok",
  "funcion": "espesante; hidratante filmógeno"
 },
 "STERCULIA URENS GUM": {
  "nombre_com": "Goma karaya",
  "categorias": [],
  "severidad": "verde",
  "nota": "Exudado del árbol Sterculia urens. Forma película: idea para lacas o sprays capilares naturales. Difícil de conseguir.",
  "lactancia": "ok",
  "funcion": "filmógeno"
 },
 "PECTIN": {
  "nombre_com": "Pectina",
  "categorias": [],
  "severidad": "verde",
  "nota": "Fibra soluble de piel de manzana y albedo de cítricos. La de alto metoxilo gelifica a pH ácido (≈ 3) con azúcar; la de bajo metoxilo, con calcio. Pierde la función por encima de ≈ 65 °C: complicada, útil en fórmulas ácidas.",
  "lactancia": "ok",
  "funcion": "espesante, gelificante"
 },
 "DEXTRAN": {
  "nombre_com": "Dextrano",
  "categorias": [],
  "severidad": "verde",
  "nota": "Polisacárido de glucosa, ramificado, obtenido por fermentación bacteriana. Gelificante y humectante.",
  "lactancia": "ok",
  "funcion": "gelificante"
 },
 "GELATIN": {
  "nombre_com": "Gelatina",
  "categorias": [
   "no_cosmetica_natural"
  ],
  "severidad": "amarillo",
  "nota": "Proteína del colágeno animal (piel, huesos: subproducto cárnico). Espesante que da geles inestables con el calor. Inocua, pero no vegana y el curso indica que no se admite en cosmética natural. COSMOS no la admite: prohíbe materias primas obtenidas de animales sacrificados.",
  "lactancia": "ok",
  "funcion": "espesante proteico"
 },
 "CASEIN": {
  "nombre_com": "Caseína",
  "categorias": [],
  "severidad": "verde",
  "nota": "Proteína de la leche. Gelificante proteico y filmógeno. Según el curso, admitida en cosmética natural; no vegana. Precaución en alergia a la proteína de leche de vaca.",
  "lactancia": "ok",
  "funcion": "gelificante proteico"
 },
 "WHEY PROTEIN": {
  "nombre_com": "Proteína de suero de leche",
  "categorias": [],
  "severidad": "verde",
  "nota": "Proteína del suero de la leche. Gelificante proteico y humectante. Admitida en cosmética natural según el curso; no vegana.",
  "lactancia": "ok",
  "funcion": "gelificante proteico"
 },
 "GLYCINE SOJA PROTEIN": {
  "nombre_com": "Proteína de soja",
  "categorias": [],
  "severidad": "verde",
  "nota": "Proteína vegetal de soja. Gelificante proteico y filmógeno.",
  "lactancia": "ok",
  "funcion": "gelificante proteico; filmógeno"
 },
 "METHYLCELLULOSE": {
  "nombre_com": "Metilcelulosa",
  "categorias": [],
  "severidad": "amarillo",
  "nota": "Celulosa modificada químicamente (semisintética). Gelificante inocuo; la admisión en cosmética natural depende del sello y del proceso: comprobar. Sin grados aprobados por COSMOS en su base de datos (consulta 16/11/2026).",
  "lactancia": "ok",
  "funcion": "gelificante"
 },
 "HYDROXYPROPYLCELLULOSE": {
  "nombre_com": "Hidroxipropilcelulosa",
  "categorias": [],
  "severidad": "amarillo",
  "nota": "Celulosa modificada con óxido de propileno (semisintética). Gelificante inocuo; el curso pide comprobar si el estándar natural que sigas la admite. COSMOS no admite el uso de óxido de propileno ni de otros óxidos de alquileno.",
  "lactancia": "ok",
  "funcion": "gelificante"
 },
 "SUCROSE LAURATE": {
  "nombre_com": "Laurato de sacarosa",
  "categorias": [],
  "severidad": "verde",
  "nota": "Éster de sacarosa y ácido láurico (de coco). Emulsionante suave O/A; es el tensioactivo del Sucragel (con aceite de almendra, glicerina y agua), que no es un oleogelificante en sentido estricto sino un sistema emulsionante.",
  "lactancia": "ok",
  "funcion": "emulsionante O/W (Sucragel)"
 },
 "SUCROSE OLEATE": {
  "nombre_com": "Oleato de sacarosa",
  "categorias": [],
  "severidad": "verde",
  "nota": "Éster de sacarosa y ácido oleico. Emulsionante no iónico de origen vegetal.",
  "lactancia": "ok",
  "funcion": "emulsionante"
 },
 "METHYL GLUCOSE SESQUISTEARATE": {
  "nombre_com": "Sesquiestearato de metilglucosa",
  "categorias": [],
  "severidad": "verde",
  "nota": "Emulsionante no iónico de glucosa y ácido esteárico de origen vegetal (comercial: Emulsan). Suave, para cremas O/A.",
  "lactancia": "ok",
  "funcion": "emulsionante O/W"
 },
 "METHYL ALCOHOL": {
  "nombre_com": "Metanol",
  "categorias": [
   "alcohol_desecante",
   "petroquimico"
  ],
  "severidad": "amarillo",
  "nota": "El alcohol más sencillo. Tóxico si se ingiere; en cosméticos solo se permite como desnaturalizante del etanol o del isopropanol, con un máximo del 5 % sobre esos alcoholes (Anexo III). Se obtiene casi siempre del gas natural. COSMOS admite los desnaturalizantes del alcohol (salvo ftalatos) solo cuando la ley lo exige.",
  "funcion": "desnaturalizante del alcohol",
  "pct": "≤ 5 % del alcohol (límite legal)"
 },
 "LAURAMIDOPROPYL BETAINE": {
  "nombre_com": "Lauramidopropil betaína",
  "categorias": [
   "no_cosmetica_natural"
  ],
  "severidad": "amarillo",
  "nota": "Tensioactivo anfótero suave, pariente de la cocamidopropil betaína. Se fabrica con un intermedio de síntesis (DMAPA), a cuyas impurezas se atribuye la sensibilización de esta familia. COSMOS solo admite de esta familia la cocamidopropil betaína, la olivamidopropil betaína y la coco-betaína; esta no.",
  "lactancia": "ok",
  "afecciones_relevantes": [
   "dermatitis"
  ],
  "funcion": "limpiador suave (anfótero)"
 },
 "LAURYL PHOSPHATE": {
  "nombre_com": "Laurilfosfato",
  "categorias": [],
  "severidad": "amarillo",
  "nota": "Tensioactivo aniónico (éster fosfórico del alcohol láurico). Detergente suave. De base vegetal pero modificado químicamente: comprobar su aprobación en el sello que sigas. Sin grados aprobados por COSMOS en su base de datos (consulta 16/11/2026).",
  "funcion": "detergente (aniónico)"
 },
 "SODIUM LAURYL SULFOACETATE": {
  "nombre_com": "Laurilsulfoacetato sódico (SLSA)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Tensioactivo aniónico en polvo, de mucha espuma; pH ≈ 6. No es un sulfato aunque el nombre se parezca. Según el curso, aceptado en las categorías de cosmética natural (comprobar el grado concreto).",
  "lactancia": "ok",
  "funcion": "tensioactivo principal (aniónico)"
 },
 "SODIUM COCOYL SARCOSINATE": {
  "nombre_com": "Cocoil sarcosinato sódico",
  "categorias": [
   "no_cosmetica_natural"
  ],
  "severidad": "amarillo",
  "nota": "Tensioactivo aniónico de aminoácido (sarcosina) y ácidos grasos de coco: buena espuma y tacto acondicionador, eficaz a pH 4–7. La sarcosina suele ser de síntesis: comprobar su admisión en cosmética natural. Sin grados aprobados por COSMOS en su base de datos (consulta 16/11/2026).",
  "lactancia": "ok",
  "funcion": "cotensioactivo aniónico"
 },
 "SULFATED CASTOR OIL": {
  "nombre_com": "Aceite de ricino sulfatado",
  "categorias": [],
  "severidad": "verde",
  "nota": "Aceite de ricino tratado con ácido sulfúrico («aceite rojo turco»): tensioactivo aniónico hidrosoluble que dispersa los aceites en el agua. Suave; útil en bifásicos desmaquillantes y aceites de baño.",
  "lactancia": "ok",
  "funcion": "tensioactivo aniónico; dispersa aceites"
 },
 "BRASSICYL ISOLEUCINATE ESYLATE": {
  "nombre_com": "Isoleucinato de brasicilo (esilato)",
  "categorias": [],
  "severidad": "amarillo",
  "nota": "Acondicionador catiónico de aceite de colza y un aminoácido, alternativa al BTMS. Aceptado por COSMOS (p. ej. Emulsense™ de Inolex, solo como tensioactivo en productos con aclarado).",
  "funcion": "acondicionador capilar (catiónico)"
 },
 "LEUCONOSTOC/RADISH ROOT FERMENT FILTRATE": {
  "nombre_com": "Fermento de rábano (Leucidal)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Filtrado de la fermentación de rábano con Leuconostoc kimchii: péptidos antimicrobianos (bacteriocinas) y ácidos orgánicos. No está en el Anexo V (no puede declararse como conservante) y su eficacia, débil frente a hongos y levaduras, depende mucho de la fórmula: exige challenge test.",
  "lactancia": "ok",
  "funcion": "antimicrobiano (fuera del Anexo V)",
  "pct": "2–4 %"
 },
 "CITRUS GRANDIS SEED EXTRACT": {
  "nombre_com": "Extracto de semilla de pomelo",
  "categorias": [
   "conservante_controvertido"
  ],
  "severidad": "amarillo",
  "nota": "Se vende como «conservante natural», pero varios análisis encontraron que su actividad antimicrobiana se debía a conservantes sintéticos añadidos (cloruro de bencetonio, triclosán, metilparabeno). Pedir al proveedor análisis que lo descarten. Hay algún extracto aprobado por COSMOS (p. ej. Pam Extract KS); comprueba el sello del producto.",
  "funcion": "«conservante natural» (eficacia dudosa)"
 },
 "DICHLOROBENZYL ALCOHOL": {
  "nombre_com": "Alcohol 2,4-diclorobencílico",
  "categorias": [
   "no_cosmetica_natural",
   "conservante_controvertido"
  ],
  "severidad": "amarillo",
  "nota": "Conservante de síntesis autorizado en el Anexo V (máx. 0,15 %). Inocuo a esa dosis, pero no es natural. Sin grados aprobados por COSMOS en su base de datos (consulta 16/11/2026).",
  "funcion": "conservante",
  "pct": "≤ 0,15 % (límite legal)"
 },
 "POTASSIUM BENZOATE": {
  "nombre_com": "Benzoato potásico",
  "categorias": [],
  "severidad": "verde",
  "nota": "Sal potásica del ácido benzoico, aceptada en COSMOS. En la fórmula se comporta como el ácido benzoico: solo protege a pH ácido (≈ ≤ 5,5), sobre todo frente a mohos y levaduras. Suele ser de síntesis petroquímica, idéntico al natural; COSMOS lo admite en su lista temporal de conservantes (apéndice V.1).",
  "lactancia": "ok",
  "funcion": "conservante (ácido orgánico)",
  "pct": "≤ 0,5 % como ácido (sin aclarado, Anexo V)"
 },
 "ASCORBYL GLUCOSIDE": {
  "nombre_com": "Ascorbil glucósido",
  "categorias": [],
  "severidad": "amarillo",
  "nota": "Derivado de la vitamina C unido a glucosa: estable en agua y fácil de formular. Su conversión a ácido ascórbico activo en la piel es variable y la evidencia clínica, modesta. De síntesis (origen no petroquímico: vitamina C y almidón, por vía enzimática). Aceptado por COSMOS (varios grados aprobados).",
  "lactancia": "ok",
  "funcion": "antioxidante; iluminador"
 },
 "MAGNESIUM ASCORBYL PHOSPHATE": {
  "nombre_com": "Ascorbil fosfato magnésico (MAP)",
  "categorias": [],
  "severidad": "amarillo",
  "nota": "Derivado hidrosoluble y estable de la vitamina C (pH 6–7). Su conversión a ácido ascórbico en la piel es variable. De síntesis. Sin grados aprobados por COSMOS en su base de datos (consulta 16/11/2026).",
  "lactancia": "ok",
  "funcion": "antioxidante; iluminador"
 },
 "3-O-ETHYL ASCORBIC ACID": {
  "nombre_com": "Etil ascórbico",
  "categorias": [],
  "severidad": "amarillo",
  "nota": "Derivado estable de la vitamina C, hidro y algo liposoluble. Evidencia clínica limitada. De síntesis. Aparece en una mezcla aprobada por COSMOS, sin grado puro aprobado: comprueba el sello del producto.",
  "lactancia": "ok",
  "funcion": "antioxidante; iluminador"
 },
 "TETRAHEXYLDECYL ASCORBATE": {
  "nombre_com": "Tetrahexildecil ascorbato",
  "categorias": [],
  "severidad": "amarillo",
  "nota": "Derivado liposoluble de la vitamina C (va en fase grasa). Su conversión a ácido ascórbico en la piel está poco documentada. De síntesis (origen no petroquímico en los grados aprobados). Aceptado por COSMOS (varios grados aprobados).",
  "lactancia": "ok",
  "funcion": "antioxidante (fase grasa)"
 },
 "LYCOPENE": {
  "nombre_com": "Licopeno",
  "categorias": [],
  "severidad": "verde",
  "nota": "Carotenoide rojo del tomate (un caroteno, sin oxígeno; no es provitamina A). Antioxidante que desactiva el oxígeno singlete. La protección frente al eritema solar está demostrada por vía oral, no tópica. Liposoluble y fotosensible: envase opaco.",
  "lactancia": "ok",
  "funcion": "antioxidante (fase grasa)"
 },
 "LUTEIN": {
  "nombre_com": "Luteína",
  "categorias": [],
  "severidad": "verde",
  "nota": "Xantofila (carotenoide oxigenado) de verduras verdes y caléndula. Absorbe luz azul en la retina; su efecto tópico frente a la luz azul no tiene estudios. Liposoluble, tiñe de amarillo-naranja.",
  "lactancia": "ok",
  "funcion": "antioxidante (fase grasa)"
 },
 "ZEAXANTHIN": {
  "nombre_com": "Zeaxantina",
  "categorias": [],
  "severidad": "verde",
  "nota": "Xantofila pariente de la luteína. Antioxidante liposoluble; sin estudios tópicos sólidos frente a la luz azul.",
  "lactancia": "ok",
  "funcion": "antioxidante (fase grasa)"
 },
 "ASTAXANTHIN": {
  "nombre_com": "Astaxantina",
  "categorias": [],
  "severidad": "verde",
  "nota": "Xantofila roja que se obtiene de la microalga Haematococcus pluvialis. Antioxidante muy potente in vitro; liposoluble, se fotooxida (envase opaco y antioxidante) y tiñe de naranja a dosis altas.",
  "lactancia": "ok",
  "funcion": "antioxidante (fase grasa)"
 },
 "CARNITINE": {
  "nombre_com": "L-carnitina",
  "categorias": [],
  "severidad": "amarillo",
  "nota": "Transporta los ácidos grasos al interior de la mitocondria para quemarlos. Se usa en anticelulíticos; el efecto tópico es modesto. Suele obtenerse por síntesis o biotransformación. Sin grados aprobados por COSMOS en su base de datos (consulta 16/11/2026).",
  "lactancia": "ok",
  "funcion": "activo anticelulítico"
 },
 "CHITOSAN": {
  "nombre_com": "Quitosano",
  "categorias": [],
  "severidad": "verde",
  "nota": "Polisacárido catiónico (no es una proteína) que se obtiene de caparazones de crustáceos o de hongos (apto vegano si es fúngico). Forma película y se adhiere a piel y pelo; solo es soluble a pH ácido (< 6,5). Más espesante que el hialurónico.",
  "lactancia": "ok",
  "funcion": "filmógeno, hidratante"
 },
 "HYDROLYZED SOY PROTEIN": {
  "nombre_com": "Proteína de soja hidrolizada",
  "categorias": [],
  "severidad": "verde",
  "nota": "Péptidos de soja: humectantes y filmógenos en superficie. Que «estimulen el colágeno» por vía tópica no tiene base.",
  "lactancia": "ok",
  "funcion": "humectante, filmógeno"
 },
 "HYDROLYZED OAT PROTEIN": {
  "nombre_com": "Proteína de avena hidrolizada",
  "categorias": [],
  "severidad": "verde",
  "nota": "Péptidos de avena: humectantes y filmógenos, acondicionan piel y pelo. Bien tolerados.",
  "lactancia": "ok",
  "funcion": "humectante, filmógeno"
 },
 "HYDROLYZED RICE PROTEIN": {
  "nombre_com": "Proteína de arroz hidrolizada",
  "categorias": [],
  "severidad": "verde",
  "nota": "Péptidos de arroz: humectantes y filmógenos, acondicionan piel y pelo.",
  "lactancia": "ok",
  "funcion": "humectante, filmógeno"
 },
 "PCA": {
  "nombre_com": "Ácido pirrolidona carboxílico",
  "categorias": [],
  "severidad": "verde",
  "nota": "Componente del factor natural de hidratación de la piel (se forma a partir de la filagrina). Higroscópico. En cosmética se usa sobre todo su sal, el Sodium PCA.",
  "lactancia": "ok",
  "funcion": "humectante"
 },
 "SALIX ALBA BARK EXTRACT": {
  "nombre_com": "Extracto de corteza de sauce",
  "categorias": [],
  "severidad": "verde",
  "nota": "Contiene salicina, precursora del ácido salicílico al ingerirse, pero no en la piel (apenas se transforma): no exfolia como el ácido salicílico ni equivale a un «salicílico natural». Calmante y astringente suave.",
  "funcion": "calmante, astringente"
 },
 "SYMPHYTUM OFFICINALE ROOT EXTRACT": {
  "nombre_com": "Extracto de raíz de consuelda",
  "categorias": [],
  "severidad": "amarillo",
  "nota": "Aporta alantoína, pero la raíz también contiene alcaloides pirrolizidínicos (hepatotóxicos y genotóxicos). Solo extractos certificados libres de ellos, y nunca sobre piel lesionada. No aporta urea. Hay extractos de consuelda aprobados por COSMOS; aun así, pide el certificado libre de alcaloides pirrolizidínicos.",
  "lactancia": "precaucion",
  "funcion": "calmante, reparador"
 },
 "HYPERICUM PERFORATUM FLOWER EXTRACT": {
  "nombre_com": "Extracto / oleato de hipérico",
  "categorias": [],
  "severidad": "verde",
  "nota": "Hipérico (hierba de San Juan), habitual como oleato. La hipericina es fotosensibilizante por vía oral; en el oleato tópico pasa poca, pero la prudencia habitual es no aplicarlo antes de exponerse al sol. Calmante y reparador.",
  "afecciones_relevantes": [
   "manchas"
  ],
  "funcion": "calmante (macerado oleoso)"
 },
 "MALACHITE EXTRACT": {
  "nombre_com": "Extracto de malaquita",
  "categorias": [],
  "severidad": "verde",
  "nota": "Mineral (carbonato básico de cobre) molido o extraído. Lo de que el cobre aporte «luminosidad» no tiene base: en cosmética es sobre todo argumento de marketing. El cobre libre, además, cataliza la oxidación de los aceites.",
  "funcion": "activo mineral (marketing)"
 },
 "ILLITE": {
  "nombre_com": "Illita (arcilla verde o rosa)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Arcilla laminar componente de la arcilla verde (con montmorillonita) y de algunas rosas. Absorbente y purificante, para pieles grasas. Pide arcilla tratada (sin carga microbiana) y certificado de metales pesados.",
  "lactancia": "ok",
  "funcion": "absorbente; espesante de mascarillas"
 },
 "MONTMORILLONITE": {
  "nombre_com": "Montmorillonita",
  "categorias": [],
  "severidad": "verde",
  "nota": "Arcilla esmectita (principal componente de la bentonita y de la arcilla verde): mete agua entre sus láminas y se hincha. Absorbente y espesante. Lo de «detox» es lenguaje comercial; los riesgos reales son contaminación microbiana y metales pesados (pedir análisis).",
  "lactancia": "ok",
  "funcion": "absorbente; espesante"
 },
 "MOROCCAN LAVA CLAY": {
  "nombre_com": "Rhassoul (ghassoul)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Arcilla del Atlas marroquí (esmectita magnésica): se hincha unas 4 veces su peso en agua. Limpia y exfolia suave; apta para casi todas las pieles.",
  "lactancia": "ok",
  "funcion": "limpiador, espesante, exfoliante suave"
 },
 "CHLOROPHYLLIN-COPPER COMPLEX": {
  "nombre_com": "Clorofilina cúprica (CI 75810)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Colorante verde derivado de la clorofila (se saponifica y se le une cobre para estabilizarla). Autorizado como colorante (CI 75810). Se usa a dosis mínimas.",
  "lactancia": "ok",
  "funcion": "colorante verde",
  "pct": "≈ 0,05 % (prácticas del curso)"
 }
};
const ALIAS_APUNTES = {
 "CITRUS AURANTIUM AMARA LEAF OIL": "CITRUS AURANTIUM AMARA LEAF/TWIG OIL",
 "CUPRESSUS SEMPERVIRENS LEAF OIL": "CUPRESSUS SEMPERVIRENS OIL",
 "JASMINUM OFFICINALE FLOWER EXTRACT": "JASMINUM GRANDIFLORUM FLOWER EXTRACT",
 "MYROXYLON PEREIRAE BALSAM": "MYROXYLON PEREIRAE RESIN",
 "ORYZA SATIVA BRAN WAX": "ORYZA SATIVA BRAN CERA",
 "ORYZA SATIVA CERA": "ORYZA SATIVA BRAN CERA",
 "POLYGLYCEROL-3 BEESWAX": "POLYGLYCERYL-3 BEESWAX",
 "POLYGLICEROL 3 BEESWAX": "POLYGLYCERYL-3 BEESWAX",
 "CYAMOPSIS TETRAGONOLOBUS GUM": "CYAMOPSIS TETRAGONOLOBA GUM",
 "GUAR GUM": "CYAMOPSIS TETRAGONOLOBA GUM",
 "LOCUST BEAN GUM": "CERATONIA SILIQUA GUM",
 "LAURIC AMIDE PROPIL BETAINE": "LAURAMIDOPROPYL BETAINE",
 "LEUCONOSTOC RADISH ROOT FERMENT FILTRATE": "LEUCONOSTOC/RADISH ROOT FERMENT FILTRATE",
 "CITRUS PARADISI SEED EXTRACT": "CITRUS GRANDIS SEED EXTRACT",
 "ASCORBYL-2-GLUCOSIDE": "ASCORBYL GLUCOSIDE",
 "ETHYL ASCORBIC ACID": "3-O-ETHYL ASCORBIC ACID",
 "ASCORBYL TETRAISOPALMITATE": "TETRAHEXYLDECYL ASCORBATE",
 "PYRROLIDONE CARBOXYLIC ACID": "PCA",
 "HYPERICUM PERFORATUM EXTRACT": "HYPERICUM PERFORATUM FLOWER EXTRACT",
 "HYPERICUM PERFORATUM OIL": "HYPERICUM PERFORATUM FLOWER EXTRACT",
 "RHASSOUL": "MOROCCAN LAVA CLAY",
 "CETOESTEARYL ALCOHOL": "CETEARYL ALCOHOL",
 "COCAMIDE DIETHANOLAMIDE": "COCAMIDE DEA",
 "GLYCERYL MONOSTEARATE": "GLYCERYL STEARATE",
 "LECITINA": "LECITHIN",
 "CERA FLAVA": "CERA ALBA",
 "COPERNICIA CERIFERA WAX": "COPERNICIA CERIFERA CERA",
 "SALVIA ROSMARINUS LEAF EXTRACT": "ROSMARINUS OFFICINALIS LEAF EXTRACT",
 "PELARGONIUM GRAVEOLENS OIL": "PELARGONIUM GRAVEOLENS FLOWER OIL",
 "CITRUS AURANTIFOLIA OIL": "CITRUS AURANTIFOLIA PEEL OIL",
 "LANOLIN WAX": "LANOLIN",
 "NICOTINIC ACID": "NIACIN",
 "DL-PANTHENOL": "PANTHENOL",
 "D-PANTHENOL": "PANTHENOL",
 "SODIUM ESTEARATE": "SODIUM STEARATE",
 "GLYCERIL STEARATE": "GLYCERYL STEARATE",
 "CENTRIMONIUM CHLORIDE": "CETRIMONIUM CHLORIDE",
 "COCOBETAINE": "COCO-BETAINE"
};
// Notas existentes corregidas con las cajas de bioquímica del curso (ver documento de revisión)
const NOTAS_APUNTES = {
 "ASCORBIC ACID": "Vitamina C. Antioxidante potente, estimulante de la síntesis de colágeno e iluminador. Muy inestable: se oxida con la luz, el calor, el oxígeno y las trazas de hierro o cobre (sin quelante puede volverse prooxidante). Para penetrar en la piel necesita pH < 3,5 y concentraciones del 10–20 %; por eso se usan tanto sus derivados estables. De síntesis (origen no petroquímico): se fabrica a partir de glucosa.",
 "ASCORBYL PALMITATE": "Éster de vitamina C y ácido palmítico, liposoluble. Funciona sobre todo como antioxidante de la fase grasa (sinérgico con la vitamina E). No es tan estable como se dice y se convierte poco en ácido ascórbico en la piel: como activo de vitamina C es flojo. De síntesis (origen no petroquímico): vitamina C esterificada con ácido palmítico vegetal. Aceptado por COSMOS.",
 "TOCOPHEROL": "Vitamina E. Antioxidante que protege los aceites de la fórmula frente al enranciamiento y, en la piel, protege los lípidos del córneo. No es un conservante: no frena microbios. A dosis altas puede volverse prooxidante (muchas fichas técnicas recomiendan 0,05–0,5 %). Los naturales vienen de soja o girasol. Puede ser de origen natural o petroquímico; en la etiqueta no se distingue.",
 "TOCOPHERYL ACETATE": "Forma esterificada y estable de la vitamina E: no se oxida, así que no protege la fórmula de la oxidación. En la piel solo actúa si las esterasas la convierten en tocoferol, y esa conversión es baja y variable. Emoliente. Puede ser de origen natural (d-α, de aceites vegetales) o petroquímico (dl-α, de trimetilhidroquinona e isofitol); en la etiqueta no se distingue.",
 "BENZOIC ACID": "Conservante permitido en cosmética natural certificada. Solo es eficaz en su forma no disociada, es decir, a pH ácido (≈ ≤ 5): por encima pierde casi toda la actividad. Actúa sobre todo frente a mohos y levaduras. Suele ser de síntesis petroquímica, idéntico al natural; COSMOS lo admite en su lista temporal de conservantes (apéndice V.1).",
 "SORBIC ACID": "Conservante permitido en cosmética natural certificada. Solo es eficaz a pH ácido (≈ ≤ 5,5), en su forma no disociada. Actúa sobre todo frente a mohos y levaduras. Suele ser de síntesis petroquímica, idéntico al natural; COSMOS lo admite en su lista temporal de conservantes (apéndice V.1).",
 "POTASSIUM SORBATE": "Sal del ácido sórbico (presente en las bayas del serbal; el comercial suele ser de síntesis idéntica). Muy habitual en cosmética natural certificada. Bajo perfil de irritación. Actúa sobre hongos y levaduras, y solo a pH ácido (≈ ≤ 5,5): en la fórmula se comporta como el ácido sórbico. Seguro en embarazo y lactancia. Suele ser de síntesis petroquímica, idéntico al natural; COSMOS lo admite en su lista temporal de conservantes (apéndice V.1).",
 "SODIUM BENZOATE": "Sal del ácido benzoico. Es la misma molécula activa que el ácido: solo protege a pH ácido (≈ ≤ 5), sobre todo frente a mohos y levaduras. Con vitamina C puede formar trazas de benceno, sin riesgo demostrado a dosis cosméticas. Aceptado por COSMOS (apéndice V.1, lista temporal de conservantes de origen petroquímico idénticos a los naturales).",
 "DEHYDROACETIC ACID": "Conservante permitido en cosmética natural certificada, sobre todo frente a mohos y levaduras. Aguanta mejor el pH de la piel que el benzoico o el sórbico (sigue activo hasta pH ≈ 6). Suele ir con alcohol bencílico (tipo Cosgard). Suele ser de síntesis petroquímica, idéntico al natural; COSMOS lo admite en su lista temporal de conservantes (apéndice V.1).",
 "BENZYL ALCOHOL": "Conservante (sobre todo frente a bacterias; depende poco del pH), habitual en mezclas admitidas en cosmética natural junto con ácido dehidroacético. También está presente en jazmín y ylang-ylang y es alérgeno de fragancia de declaración obligatoria por encima de 0,001 % (sin aclarado). Bien tolerado a dosis de uso (≤ 1 %). Suele ser de síntesis petroquímica, idéntico al natural; COSMOS lo admite en su lista temporal de conservantes (apéndice V.1).",
 "NIACINAMIDE": "Activo sintético multifuncional (amida de la vitamina B3): uniformiza el tono, refuerza la barrera, reduce el sebo y calma (eficacia clínica al 2–5 %). No es lo mismo que el ácido nicotínico: a pH muy ácido (< 4) y con calor se hidroliza a ácido nicotínico, que provoca rubor; por eso se formula a pH 5–7. Perfil de seguridad excelente. No aceptado en cosmética orgánica certificada por ser de síntesis. Sin restricciones en embarazo ni lactancia.",
 "SODIUM LACTATE": "Humectante: es un componente del factor natural de hidratación de la piel. Es la sal de un ácido débil, casi neutra: no acidifica por sí sola (junto con el ácido láctico forma un tampón). Inocuo y aceptado en cosmética natural.",
 "PANTHENOL": "Provitamina B5. En la piel se convierte en ácido pantoténico, parte de la coenzima A que necesita la epidermis para fabricar sus lípidos: por eso repara la barrera. Humectante y calmante. Solo la forma D es activa (el DL rinde la mitad). Sin restricciones. Puede ser de origen natural (fermentación de maíz; hay grados aprobados por COSMOS) o petroquímico (vía isobutiraldehído); en la etiqueta no se distingue.",
 "RETINOL": "Activo potente. Puede causar descamación, sequedad y más sensibilidad al sol. Limitado en la UE (Reg. 2024/996): máx. 0,3 % en cara y 0,05 % en lociones corporales. Se evita en el embarazo. Uso nocturno con protección solar de día; empezar con concentraciones bajas. Muy inestable a luz y aire.",
 "LECITHIN": "Fosfolípido emulsionante de origen natural (soja o girasol); es zwitteriónico, no no iónico. Buen emoliente y mejora la penetración de activos, pero no repone los lípidos propios del córneo (allí casi no hay fosfolípidos). Ampliamente aceptado en cosmética natural certificada.",
 "SIMMONDSIA CHINENSIS SEED OIL": "Técnicamente una cera líquida (ésteres de cera), parecida a los ésteres de cera que forman ≈ 25 % del sebo humano. Muy estable frente a la oxidación y poco comedogénica (2/5). Lo de que «regula el sebo» es un argumento muy repetido sin ensayos sólidos. Uno de los ingredientes más versátiles de la cosmética natural.",
 "MACADAMIA TERNIFOLIA SEED OIL": "Excepcionalmente rico en ácido palmitoleico (omega-7). Nutritivo y emoliente, para piel madura y seca. Comedogenicidad moderada (2/5).",
 "BUTYROSPERMUM PARKII BUTTER": "Manteca rica en ácidos grasos oleico (insaturado) y esteárico (saturado), con una fracción insaponificable activa (triterpenos, fitoesteroles). Baja comedogenicidad (0/5). Emoliente, calmante y nutritiva. Ingrediente estrella de cosmética natural para piel seca, sensible y bebés. Muy bien tolerada.",
 "LINSEED OIL": "Rico en omega-3 (ácido α-linolénico), muy oxidable: necesita antioxidante y se enrancia pronto. Figura con comedogenicidad 4/5 en las escalas clásicas, que proceden del modelo de oreja de conejo y predicen mal la piel humana. Mejor para cuerpo que para rostro acneico.",
 "CAFFEINE": "Alcaloide (metilxantina) del café, el té y el guaraná. Inhibe la fosfodiesterasa y activa la lipólisis en el adipocito: es el activo anticelulítico tópico con más base, aunque con resultados modestos. También descongestiona (bolsas, ojeras). Poco soluble: por encima de ≈ 2 % cristaliza.",
 "ZINC PCA": "Sal de zinc del PCA (componente del factor natural de hidratación). Seborregulador y antibacteriano suave, para piel grasa o con tendencia acneica. Aceptado en cosmética natural.",
 "SORBITOL": "Polialcohol humectante, más suave que la glicerina. Aunque existe en frutas, el comercial se obtiene por hidrogenación de glucosa de maíz o trigo: de origen vegetal pero procesado químicamente (suele venderse al 70 %). Aceptado en cosmética natural.",
 "LACTIC ACID": "AHA más suave que el glicólico. Como regulador de pH (décimas de %) no exfolia; a dosis altas, sí. Los AHA no son fotosensibilizantes en sentido estricto, pero al adelgazar el córneo aumentan la sensibilidad a la quemadura solar: fotoprotección durante su uso y la semana siguiente. Precaución en piel muy sensible.",
 "GLYCOLIC ACID": "AHA exfoliante potente. Puede irritar en piel sensible, rosácea o barrera comprometida. No es fotosensibilizante en sentido estricto, pero al adelgazar el córneo aumenta la sensibilidad a la quemadura UV: fotoprotección diaria durante su uso y la semana siguiente.",
 "BENTONITE": "Arcilla (esmectita, rica en montmorillonita) que se hincha con el agua y absorbe sebo. Mayor poder de absorción que el caolín. Habitual en mascarillas de limpieza profunda. Lo de «desintoxicante» es lenguaje comercial; pide arcilla tratada (sin carga microbiana) y certificado de metales pesados.",
 "IRON OXIDES": "Pigmentos minerales: CI 77491 (rojo), CI 77492 (amarillo), CI 77499 (negro). Los cosméticos son en la práctica sintéticos (idénticos a los naturales) para cumplir los criterios de pureza; los estándares de cosmética natural los admiten como minerales. Sin restricciones.",
 "ROSMARINUS OFFICINALIS LEAF EXTRACT": "Antioxidante natural muy usado para proteger los aceites de la fórmula (ácido carnósico y carnosol). No es un conservante: no figura en el Anexo V y no frena microbios. En extractos acuosos aporta sobre todo ácido rosmarínico, que protege menos la fase grasa.",
 "COPPER GLUCONATE": "Sal orgánica de cobre. El cobre es cofactor de enzimas de la piel (lisil oxidasa, SOD); lo mejor documentado en reparación es el péptido de cobre GHK-Cu, no las sales sueltas. El cobre libre cataliza la oxidación de los aceites: necesita quelante y antioxidante en la fórmula.",
 "RESVERATROL": "Polifenol (estilbeno) de la piel de la uva. Antioxidante y antiinflamatorio; su efecto sobre las sirtuinas y los genes antioxidantes está descrito sobre todo in vitro y en animales. Poco soluble y se degrada con la luz UV: envase opaco. Parte del comercial se produce por fermentación con levaduras modificadas: pedir certificado no OMG.",
 "GLYCYRRHIZA GLABRA ROOT EXTRACT": "Extracto de regaliz. El liposoluble aporta glabridina (inhibe la tirosinasa: despigmentante); el acuoso, ácido glicirrícico (calmante). Útil en manchas y pieles reactivas. Sin restricciones.",
 "CITRUS AURANTIUM DULCIS PEEL OIL": "Aceite esencial de naranja dulce. A diferencia de la bergamota o la lima exprimidas, no es fototóxico, pero tiene ≈ 90–95 % de limoneno, que se vuelve sensibilizante al oxidarse: usar aceite fresco, con antioxidante y bien cerrado.",
 "QUATERNIUM-15": "Conservante liberador de formaldehído. Prohibido en cosméticos en la UE desde 2019 (Reg. 2019/831, pasa al Anexo II por su isómero cis, clasificado CMR). Si aparece en un producto vendido en la UE, ese producto no cumple la ley.",
 "METHYLPARABEN": "Parabeno de cadena corta, de los conservantes mejor tolerados y estudiados. La preocupación hormonal se centra en los de cadena larga (propil-, butil-), no en este. Autorizado en la UE con límites.",
 "SODIUM SALICYLATE": "Conservante de la familia de los salicilatos. Autorizado con límites; no es natural. Aceptado por COSMOS (apéndice V.1, lista temporal de conservantes).",
 "COCAMIDOPROPYL BETAINE": "Tensioactivo semisintético derivado del coco pero modificado químicamente. Frecuente sensibilizante (impurezas del proceso). Aceptado por COSMOS con una parte petroquímica limitada (apéndice V.3, lista temporal).",
 "PANTOLACTONE": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural. Puede ser de origen natural o petroquímico; en la etiqueta no se distingue.",
 "CALCIUM PANTOTHENATE": "Aminoácido o vitamina. Forma parte de la propia piel; aceptado en cosmética natural. De síntesis, habitualmente de origen petroquímico (misma vía que el pantenol).",
 "SODIUM ASCORBYL PHOSPHATE": "Derivado estable de la vitamina C con buena penetración cutánea. Menos irritante que el ácido ascórbico puro. Activo antioxidante e iluminador. De síntesis (origen no petroquímico): vitamina C fosforilada. Sin grado puro aprobado por COSMOS (solo dentro de una mezcla).",
 "ALLANTOIN": "Activo calmante, cicatrizante y queratolítico suave. Presente en consolda (Symphytum officinale) de forma natural, aunque la mayoría de cosmética usa síntesis química (idéntica a nivel molecular). Bien tolerado incluso en pieles muy sensibles. De síntesis, habitualmente a partir de urea y ácido glioxílico (materias primas de origen petroquímico). Sin grados aprobados por COSMOS.",
 "HYDROXYETHYLCELLULOSE": "Celulosa modificada. Espesante y gelificante. Forma texturas gel transparentes. Sin restricciones. Celulosa vegetal modificada con óxido de etileno (de origen petroquímico); COSMOS no admite ese proceso.",
 "HYDROXYPROPYL METHYLCELLULOSE": "Celulosa modificada. Espesante y texturizante. Celulosa vegetal modificada con óxido de propileno y cloruro de metilo (de origen petroquímico); COSMOS no admite los óxidos de alquileno.",
 "CELLULOSE GUM": "Espesante de origen natural (gomas, almidones, celulosa). Aceptado en cosmética natural. Celulosa vegetal con una pequeña parte de origen petroquímico (grupo carboximetilo); COSMOS la admite con límite.",
 "MANDELIC ACID": "AHA de molécula grande derivado de almendras amargas — penetra más lento que el glicólico, por lo que irrita mucho menos. Buena opción de exfoliación suave en piel sensible o acneica. Fotosensibilizante como el resto de AHAs — usar SPF. De síntesis, habitualmente de origen petroquímico (a partir de benzaldehído), aunque se asocie a las almendras amargas.",
 "TRISODIUM ETHYLENEDIAMINE DISUCCINATE": "Quelante biodegradable (ayuda a conservar). De síntesis, de origen petroquímico (etilendiamina y anhídrido maleico); sin grados aprobados por COSMOS.",
 "SODIUM METHYL COCOYL TAURATE": "Limpiador suave de origen vegetal. Ácidos grasos de coco con una parte de origen petroquímico (metiltaurina); sin grados aprobados por COSMOS.",
 "SODIUM LAUROYL METHYL ISETHIONATE": "Limpiador suave de origen vegetal. Ácido láurico vegetal con una parte de origen petroquímico (isetionato); sin grados aprobados por COSMOS.",
 "SODIUM LAUROYL SARCOSINATE": "Limpiador suave de origen vegetal. Ácido láurico vegetal con una parte de síntesis petroquímica (sarcosina); sin grados aprobados por COSMOS.",
 "PHENETHYL ALCOHOL": "Conservante permitido en cosmética natural certificada. Puede ser de origen natural o petroquímico; en la etiqueta no se distingue.",
 "SODIUM DEHYDROACETATE": "Conservante permitido en cosmética natural certificada. Suele ser de síntesis petroquímica, idéntico al natural; COSMOS lo admite en su lista temporal de conservantes (apéndice V.1)."
};
// Para qué está y % de uso en fichas que ya existían
const CAMPOS_APUNTES = {
 "HELIANTHUS ANNUUS SEED OIL": {
  "funcion": "emoliente; vehículo (base de oleatos)"
 },
 "VITIS VINIFERA SEED OIL": {
  "funcion": "emoliente; vehículo (base de oleatos)"
 },
 "PRUNUS ARMENIACA KERNEL OIL": {
  "funcion": "emoliente; vehículo (base de oleatos)"
 },
 "PRUNUS AMYGDALUS DULCIS OIL": {
  "funcion": "emoliente; vehículo (base de oleatos)"
 },
 "OENOTHERA BIENNIS OIL": {
  "funcion": "emoliente, regenerador"
 },
 "BORAGO OFFICINALIS SEED OIL": {
  "funcion": "emoliente, regenerador"
 },
 "CANNABIS SATIVA SEED OIL": {
  "funcion": "emoliente, regenerador"
 },
 "ROSA CANINA FRUIT OIL": {
  "funcion": "emoliente regenerador"
 },
 "WHEAT GERM OIL": {
  "funcion": "emoliente, antioxidante (vit. E)"
 },
 "LINSEED OIL": {
  "funcion": "emoliente"
 },
 "OLEA EUROPAEA FRUIT OIL": {
  "funcion": "emoliente"
 },
 "PERSEA GRATISSIMA OIL": {
  "funcion": "emoliente; sobreengrasante en jabón"
 },
 "MACADAMIA TERNIFOLIA SEED OIL": {
  "funcion": "emoliente, nutritivo"
 },
 "HIPPOPHAE RHAMNOIDES FRUIT OIL": {
  "funcion": "emoliente regenerador, antioxidante"
 },
 "RICINUS COMMUNIS SEED OIL": {
  "funcion": "emoliente, brillo; estabiliza la espuma en jabón",
  "pct": "5–10 % de las grasas (jabón)"
 },
 "SIMMONDSIA CHINENSIS SEED OIL": {
  "funcion": "emoliente (cera líquida)"
 },
 "ARGANIA SPINOSA KERNEL OIL": {
  "funcion": "emoliente"
 },
 "BUTYROSPERMUM PARKII BUTTER": {
  "funcion": "emoliente; estructurante"
 },
 "THEOBROMA CACAO SEED BUTTER": {
  "funcion": "estructurante: dureza; emoliente"
 },
 "GARCINIA INDICA SEED BUTTER": {
  "funcion": "emoliente; dureza"
 },
 "COCOS NUCIFERA OIL": {
  "funcion": "emoliente; dureza y espuma en jabón",
  "pct": "≤ 25–30 % de las grasas (jabón)"
 },
 "SQUALANE": {
  "funcion": "emoliente ligero"
 },
 "LANOLIN": {
  "funcion": "emoliente oclusivo"
 },
 "CERA ALBA": {
  "funcion": "estructurante (dureza); oclusivo"
 },
 "COPERNICIA CERIFERA CERA": {
  "funcion": "dureza, textura"
 },
 "EUPHORBIA CERIFERA CERA": {
  "funcion": "textura, consistencia"
 },
 "CETYL PALMITATE": {
  "funcion": "textura"
 },
 "CETYL ALCOHOL": {
  "funcion": "coemulsionante; espesante"
 },
 "STEARYL ALCOHOL": {
  "funcion": "coemulsionante; espesante"
 },
 "CETEARYL ALCOHOL": {
  "funcion": "coemulsionante; espesante"
 },
 "STEARIC ACID": {
  "funcion": "espesante; da dureza (jabones, barras)",
  "pct": "3–10 % (habitual ≈ 3 %)"
 },
 "GLYCERYL STEARATE": {
  "funcion": "coemulsionante no iónico (HLB ≈ 3,8)"
 },
 "GLYCERYL STEARATE SE": {
  "funcion": "emulsionante autoemulsionable (aniónico)"
 },
 "GLYCERYL STEARATE CITRATE": {
  "funcion": "emulsionante no iónico"
 },
 "CETEARYL OLIVATE": {
  "funcion": "emulsionante O/W (Olivem 1000)",
  "pct": "6–8 % (Olivem 1000)"
 },
 "SORBITAN OLIVATE": {
  "funcion": "emulsionante O/W (Olivem 1000)",
  "pct": "6–8 % (Olivem 1000)"
 },
 "CETEARYL GLUCOSIDE": {
  "funcion": "emulsionante O/W (Montanov 68)",
  "pct": "5–10 % (Montanov 68)"
 },
 "SODIUM CETEARYL SULFATE": {
  "funcion": "emulsionante aniónico (Lanette N)",
  "pct": "3–4 % ligera · 5–8 % densa (Lanette N)"
 },
 "SODIUM STEARATE": {
  "funcion": "emulsionante aniónico O/W; jabón"
 },
 "SODIUM OLEATE": {
  "funcion": "emulsionante aniónico; jabón"
 },
 "LECITHIN": {
  "funcion": "emulsionante (zwitteriónico)"
 },
 "SORBITAN STEARATE": {
  "funcion": "emulsionante no iónico (W/O)"
 },
 "POLYSORBATE 20": {
  "funcion": "emulsionante O/W; solubilizante"
 },
 "POLYSORBATE 60": {
  "funcion": "emulsionante O/W"
 },
 "BEHENTRIMONIUM METHOSULFATE": {
  "funcion": "acondicionador capilar; autoemulsionante catiónico (BTMS)"
 },
 "CETRIMONIUM CHLORIDE": {
  "funcion": "acondicionador; antimicrobiano"
 },
 "SODIUM LAURYL SULFATE": {
  "funcion": "detergente (aniónico)",
  "pct": "7–15 %"
 },
 "SODIUM LAURETH SULFATE": {
  "funcion": "detergente (aniónico)"
 },
 "COCO-BETAINE": {
  "funcion": "limpiador suave (anfótero)"
 },
 "COCAMIDOPROPYL BETAINE": {
  "funcion": "cotensioactivo (anfótero)",
  "pct": "5–15 % (champú sólido)"
 },
 "COCO GLUCOSIDE": {
  "funcion": "limpiador suave (no iónico)",
  "pct": "5–10 %"
 },
 "COCO-GLUCOSIDE": {
  "funcion": "limpiador suave (no iónico)",
  "pct": "5–10 %"
 },
 "DECYL GLUCOSIDE": {
  "funcion": "limpiador suave (no iónico)",
  "pct": "5–10 %"
 },
 "COCAMIDE DEA": {
  "funcion": "espesante de espuma"
 },
 "SODIUM COCOYL ISETHIONATE": {
  "funcion": "tensioactivo principal (aniónico)"
 },
 "SODIUM COCOYL GLUTAMATE": {
  "funcion": "tensioactivo (aniónico) suave"
 },
 "AQUA": {
  "funcion": "vehículo"
 },
 "GLYCERIN": {
  "funcion": "humectante; disolvente",
  "pct": "2–5 % (humectante)"
 },
 "SORBITOL": {
  "funcion": "humectante",
  "pct": "3–15 %"
 },
 "PROPYLENE GLYCOL": {
  "funcion": "humectante; disolvente"
 },
 "PROPANEDIOL": {
  "funcion": "disolvente de extractos; humectante"
 },
 "ALCOHOL": {
  "funcion": "disolvente; conservante a ≥ 20 %; astringente",
  "pct": "≥ 20 % para ayudar a conservar"
 },
 "ALCOHOL DENAT.": {
  "funcion": "disolvente; astringente"
 },
 "ISOPROPYL ALCOHOL": {
  "funcion": "desnaturalizante del etanol"
 },
 "SODIUM LACTATE": {
  "funcion": "humectante (FNH)",
  "pct": "1–5 %"
 },
 "SODIUM PCA": {
  "funcion": "humectante (FNH)",
  "pct": "3–5 % (diapositiva del curso)"
 },
 "UREA": {
  "funcion": "humectante (< 10 %); queratolítico (≥ 10 %)"
 },
 "CALCIUM CHLORIDE": {
  "funcion": "humectante (apenas se usa)"
 },
 "INULIN": {
  "funcion": "acondicionador, humectante"
 },
 "SODIUM HYALURONATE": {
  "funcion": "humectante, filmógeno",
  "pct": "0,1–1 %"
 },
 "PANTHENOL": {
  "funcion": "humectante; reparador",
  "pct": "0,5–5 %"
 },
 "ALLANTOIN": {
  "funcion": "calmante, suavizante",
  "pct": "≤ 0,5 % (si no, recristaliza)"
 },
 "XANTHAN GUM": {
  "funcion": "espesante, estabilizante; gelificante",
  "pct": "0,1–0,8 % (espesante)"
 },
 "ALGIN": {
  "funcion": "gelificante (con calcio), espesante"
 },
 "AGAR": {
  "funcion": "gelificante (en caliente)"
 },
 "CELLULOSE GUM": {
  "funcion": "gelificante, espesante"
 },
 "ACACIA SENEGAL GUM": {
  "funcion": "espesante; filmógeno"
 },
 "ZEA MAYS STARCH": {
  "funcion": "espesante; carga en polvos"
 },
 "ORYZA SATIVA STARCH": {
  "funcion": "espesante; carga en polvos"
 },
 "CARRAGEENAN": {
  "funcion": "gelificante, espesante"
 },
 "GELLAN GUM": {
  "funcion": "gelificante (con Ca/Mg)"
 },
 "MICROCRYSTALLINE CELLULOSE": {
  "funcion": "espesante; carga"
 },
 "HYDROXYETHYLCELLULOSE": {
  "funcion": "gelificante (semisintético)"
 },
 "HYDROXYPROPYL METHYLCELLULOSE": {
  "funcion": "gelificante (semisintético)"
 },
 "CARBOMER": {
  "funcion": "gelificante dependiente del pH"
 },
 "KAOLIN": {
  "funcion": "absorbente; espesante de mascarillas"
 },
 "BENTONITE": {
  "funcion": "absorbente; espesante y gelificante"
 },
 "SILICA": {
  "funcion": "espesante de ambas fases; absorbente"
 },
 "HYDRATED SILICA": {
  "funcion": "espesante; absorbente"
 },
 "SILICA SILYLATE": {
  "funcion": "espesante de aceites"
 },
 "BENZYL ALCOHOL": {
  "funcion": "conservante (sobre todo bacterias)",
  "pct": "0,6–1 % (mezclas tipo Cosgard)"
 },
 "DEHYDROACETIC ACID": {
  "funcion": "conservante (mohos y levaduras)",
  "pct": "0,6–1 % (mezclas tipo Cosgard)"
 },
 "SODIUM DEHYDROACETATE": {
  "funcion": "conservante (mohos y levaduras)"
 },
 "BENZOIC ACID": {
  "funcion": "conservante (eficaz a pH ≤ 5)",
  "pct": "≤ 0,5 % sin aclarado (Anexo V)"
 },
 "SODIUM BENZOATE": {
  "funcion": "conservante (eficaz a pH ≤ 5)",
  "pct": "≤ 0,5 % como ácido, sin aclarado (Anexo V)"
 },
 "SORBIC ACID": {
  "funcion": "conservante (eficaz a pH ≤ 5,5)",
  "pct": "≤ 0,6 % (Anexo V)"
 },
 "POTASSIUM SORBATE": {
  "funcion": "conservante (eficaz a pH ≤ 5,5)",
  "pct": "≤ 0,6 % como ácido (Anexo V)"
 },
 "PHENOXYETHANOL": {
  "funcion": "conservante",
  "pct": "≤ 1 % (Anexo V)"
 },
 "METHYLPARABEN": {
  "funcion": "conservante"
 },
 "ETHYLPARABEN": {
  "funcion": "conservante"
 },
 "PROPYLPARABEN": {
  "funcion": "conservante"
 },
 "BUTYLPARABEN": {
  "funcion": "conservante"
 },
 "DIAZOLIDINYL UREA": {
  "funcion": "conservante"
 },
 "IMIDAZOLIDINYL UREA": {
  "funcion": "conservante"
 },
 "DMDM HYDANTOIN": {
  "funcion": "conservante"
 },
 "TRICLOSAN": {
  "funcion": "conservante"
 },
 "METHYLCHLOROISOTHIAZOLINONE": {
  "funcion": "conservante"
 },
 "METHYLISOTHIAZOLINONE": {
  "funcion": "conservante"
 },
 "TOCOPHEROL": {
  "funcion": "antioxidante de la fase grasa",
  "pct": "0,05–0,5 % (fichas técnicas; el curso da 0,5–1 %)"
 },
 "TOCOPHERYL ACETATE": {
  "funcion": "activo (no protege la fórmula)"
 },
 "ASCORBYL PALMITATE": {
  "funcion": "antioxidante de la fase grasa"
 },
 "ASCORBIC ACID": {
  "funcion": "antioxidante; activo",
  "pct": "10–20 % a pH < 3,5 (como activo)"
 },
 "ROSMARINUS OFFICINALIS LEAF EXTRACT": {
  "funcion": "antioxidante de la fase grasa",
  "pct": "0,5–1 % (emulsión)"
 },
 "BHT": {
  "funcion": "antioxidante"
 },
 "BHA": {
  "funcion": "antioxidante"
 },
 "CITRIC ACID": {
  "funcion": "acidificante; quelante; tampón (con citrato)"
 },
 "SODIUM CITRATE": {
  "funcion": "tampón de pH (con ácido cítrico)"
 },
 "LACTIC ACID": {
  "funcion": "acidificante; a dosis altas, AHA exfoliante"
 },
 "SODIUM BICARBONATE": {
  "funcion": "alcalinizante suave"
 },
 "SODIUM HYDROXIDE": {
  "funcion": "alcalinizante; saponifica (jabón)"
 },
 "DISODIUM EDTA": {
  "funcion": "quelante"
 },
 "PHYTIC ACID": {
  "funcion": "quelante (sobre todo de hierro)",
  "pct": "≈ 0,2 %"
 },
 "SODIUM PHYTATE": {
  "funcion": "quelante",
  "pct": "≈ 0,05–0,2 % (comprobar en la ficha)"
 },
 "TETRASODIUM GLUTAMATE DIACETATE": {
  "funcion": "quelante"
 },
 "NIACINAMIDE": {
  "funcion": "activo (manchas, barrera, sebo)",
  "pct": "2–5 %"
 },
 "RETINOL": {
  "funcion": "activo (renovación celular)",
  "pct": "≤ 0,3 % cara · ≤ 0,05 % cuerpo (Reg. 2024/996)"
 },
 "RETINYL PALMITATE": {
  "funcion": "activo (precursor del retinol)",
  "pct": "≤ 0,3 % eq. retinol (Reg. 2024/996)"
 },
 "ALPHA-BISABOLOL": {
  "funcion": "calmante",
  "pct": "0,1–1 %"
 },
 "CAFFEINE": {
  "funcion": "activo descongestionante, anticelulítico",
  "pct": "≤ 1,5–2 % (si no, cristaliza)"
 },
 "SALICYLIC ACID": {
  "funcion": "exfoliante (BHA)",
  "pct": "≤ 2 % en la mayoría de productos (Anexo III)"
 },
 "MENTHOL": {
  "funcion": "refrescante",
  "pct": "dosis muy baja"
 },
 "METHYL SALICYLATE": {
  "funcion": "efecto calor",
  "pct": "dosis muy baja"
 },
 "CERAMIDE NP": {
  "funcion": "lípido de barrera"
 },
 "LINOLEIC ACID": {
  "funcion": "lípido de barrera"
 },
 "GLYCOLIC ACID": {
  "funcion": "AHA exfoliante; humectante"
 },
 "TARTARIC ACID": {
  "funcion": "AHA; antioxidante",
  "pct": "limitado (irrita a dosis alta)"
 },
 "GLUCONOLACTONE": {
  "funcion": "PHA exfoliante suave"
 },
 "LACTOBIONIC ACID": {
  "funcion": "PHA exfoliante suave; quelante"
 },
 "HYDROLYZED COLLAGEN": {
  "funcion": "humectante, filmógeno"
 },
 "HYDROLYZED ELASTIN": {
  "funcion": "humectante, filmógeno"
 },
 "HYDROLYZED SILK": {
  "funcion": "humectante, filmógeno"
 },
 "HYDROLYZED MILK PROTEIN": {
  "funcion": "humectante, filmógeno"
 },
 "HYDROLYZED WHEAT PROTEIN": {
  "funcion": "acondicionador; filmógeno"
 },
 "CAMELLIA SINENSIS LEAF EXTRACT": {
  "funcion": "antioxidante"
 },
 "RESVERATROL": {
  "funcion": "antioxidante"
 },
 "BETA-CAROTENE": {
  "funcion": "antioxidante; colorante"
 },
 "UBIQUINONE": {
  "funcion": "antioxidante (fase grasa)"
 },
 "ZINC GLUCONATE": {
  "funcion": "seborregulador"
 },
 "ZINC PCA": {
  "funcion": "seborregulador"
 },
 "ZINC OXIDE": {
  "funcion": "filtro UV mineral; astringente"
 },
 "COPPER GLUCONATE": {
  "funcion": "activo (cofactor de enzimas)"
 },
 "ALOE BARBADENSIS LEAF JUICE": {
  "funcion": "hidratante, calmante"
 },
 "CENTELLA ASIATICA EXTRACT": {
  "funcion": "reparador"
 },
 "CHAMOMILLA RECUTITA FLOWER EXTRACT": {
  "funcion": "calmante"
 },
 "CALENDULA OFFICINALIS FLOWER EXTRACT": {
  "funcion": "calmante (a menudo como oleato)"
 },
 "GLYCYRRHIZA GLABRA ROOT EXTRACT": {
  "funcion": "calmante; despigmentante"
 },
 "FUCUS VESICULOSUS EXTRACT": {
  "funcion": "hidratante filmógeno; anticelulítico"
 },
 "ARNICA MONTANA FLOWER EXTRACT": {
  "funcion": "activo circulatorio"
 },
 "MELALEUCA ALTERNIFOLIA LEAF OIL": {
  "funcion": "aroma; antibacteriano"
 },
 "HAMAMELIS VIRGINIANA WATER": {
  "funcion": "vehículo acuoso; astringente",
  "pct": "puede sustituir al agua"
 },
 "CHAMOMILLA RECUTITA FLOWER WATER": {
  "funcion": "vehículo; calmante"
 },
 "CITRUS AURANTIUM AMARA FLOWER WATER": {
  "funcion": "vehículo; aroma"
 },
 "ROSA DAMASCENA FLOWER WATER": {
  "funcion": "vehículo"
 },
 "LAVANDULA ANGUSTIFOLIA FLOWER WATER": {
  "funcion": "vehículo"
 },
 "LAVANDULA ANGUSTIFOLIA OIL": {
  "funcion": "aroma"
 },
 "PELARGONIUM GRAVEOLENS FLOWER OIL": {
  "funcion": "aroma"
 },
 "CYMBOPOGON MARTINI OIL": {
  "funcion": "aroma"
 },
 "CITRUS AURANTIUM DULCIS PEEL OIL": {
  "funcion": "aroma"
 },
 "IRON OXIDES": {
  "funcion": "pigmento"
 }
};
Object.entries(DB_APUNTES).forEach(([k, v]) => { if (!INCI_DB[k]) INCI_DB[k] = v; });
Object.entries(ALIAS_APUNTES).forEach(([k, v]) => { if (!INCI_DB[k]) INCI_DB[k] = { alias: v }; });
Object.entries(NOTAS_APUNTES).forEach(([k, nota]) => { if (INCI_DB[k] && !INCI_DB[k].alias) INCI_DB[k].nota = nota; });
Object.entries(CAMPOS_APUNTES).forEach(([k, c]) => { if (INCI_DB[k] && !INCI_DB[k].alias) Object.assign(INCI_DB[k], c); });
// ── v3 (16/11/2026): fichas completas de ingredientes vegetales que antes resolvía la regla por familia ──
// Color = el que daba la regla. Comedogenicidad: escala clásica de Fulton (1989), orientativa.
const DB_VEGETALES_V3 = {
 "CARTHAMUS TINCTORIUS SEED OIL": {
  "nombre_com": "Aceite de cártamo",
  "categorias": [],
  "severidad": "verde",
  "nota": "Aceite muy rico en ácido linoleico (≈ 70–80 % en el tipo clásico; existe una variedad alta en oleico). Ligero, tacto seco; el linoleico es el ácido graso que falta en el sebo de la piel con acné, así que encaja en piel grasa y mixta. Oxidable: pide antioxidante.",
  "lactancia": "ok",
  "comedogenico": 0,
  "funcion": "emoliente; vehículo"
 },
 "ARACHIS HYPOGAEA OIL": {
  "nombre_com": "Aceite de cacahuete",
  "categorias": [],
  "severidad": "verde",
  "nota": "Rico en oleico (≈ 35–70 %) y linoleico, con algo de ácidos saturados de cadena muy larga (araquídico, behénico, lignocérico). Emoliente nutritivo para piel seca. El refinado apenas conserva proteína, pero en personas con alergia al cacahuete conviene evitarlo.",
  "lactancia": "ok",
  "comedogenico": 2,
  "funcion": "emoliente"
 },
 "BRASSICA CAMPESTRIS SEED OIL": {
  "nombre_com": "Aceite de colza",
  "categorias": [],
  "severidad": "verde",
  "nota": "Rico en oleico (≈ 50–70 %), con linoleico y algo de α-linolénico (≈ 5–14 %). Las variedades actuales son bajas en ácido erúcico. Emoliente ligero y económico, para piel normal o seca; es la base de muchos derivados vegetales (alcohol behenílico, catiónicos de colza).",
  "lactancia": "ok",
  "funcion": "emoliente"
 },
 "CORYLUS AVELLANA SEED OIL": {
  "nombre_com": "Aceite de avellana",
  "categorias": [],
  "severidad": "verde",
  "nota": "Muy rico en oleico (≈ 75–80 %); el palmitoleico es testimonial (< 1 %), aunque a veces se diga lo contrario. Tacto seco y buena penetración; se usa mucho en mezclas para piel mixta, aunque su fama de «astringente» no está demostrada.",
  "lactancia": "ok",
  "funcion": "emoliente (tacto seco)"
 },
 "CUCURBITA PEPO SEED OIL": {
  "nombre_com": "Aceite de semilla de calabaza",
  "categorias": [],
  "severidad": "verde",
  "nota": "Rico en linoleico (≈ 45–55 %) y oleico; color verde oscuro (clorofila, carotenoides) que mancha. No aporta zinc ni EPA/DHA a la piel (los minerales se quedan en la torta). Emoliente; oxidable: pide antioxidante.",
  "lactancia": "ok",
  "funcion": "emoliente; color verde"
 },
 "COFFEA ARABICA SEED OIL": {
  "nombre_com": "Aceite de café",
  "categorias": [],
  "severidad": "verde",
  "nota": "Aceite de grano de café (verde o tostado): linoleico y palmítico, con un insaponificable rico en diterpenos (cafestol, kahweol) y fitoesteroles. Emoliente con aroma característico; no aporta la cafeína de un extracto.",
  "lactancia": "ok",
  "funcion": "emoliente; activo"
 },
 "DAUCUS CAROTA SATIVA SEED OIL": {
  "nombre_com": "Aceite de semilla de zanahoria",
  "categorias": [],
  "severidad": "verde",
  "nota": "Con este INCI se vende tanto el aceite vegetal de semilla como el aceite esencial de semilla de zanahoria (carotol): mira la ficha. El color naranja intenso que se asocia a la zanahoria procede del macerado de raíz (carotenoides), no de la semilla.",
  "funcion": "emoliente; aroma (si es AE)"
 },
 "ELAEIS GUINEENSIS OIL": {
  "nombre_com": "Aceite de palma",
  "categorias": [],
  "severidad": "verde",
  "nota": "Del fruto de la palma: palmítico (≈ 40–47 %) y oleico (≈ 36–44 %). Emoliente sólido a temperatura fresca, base de jabones y de muchos derivados (glicerina, alcoholes grasos). Su problema es ambiental: pide origen sostenible certificado (RSPO).",
  "lactancia": "ok",
  "funcion": "emoliente; materia prima"
 },
 "ELAEIS GUINEENSIS KERNEL OIL": {
  "nombre_com": "Aceite de palmiste",
  "categorias": [],
  "severidad": "verde",
  "nota": "De la almendra de la palma: láurico (≈ 45–55 %) y mirístico (≈ 14–18 %), como el coco; por eso se considera comedogénico y no encaja en piel con acné. Da dureza y espuma en jabón. Pide origen sostenible (RSPO).",
  "lactancia": "ok",
  "afecciones_relevantes": [
   "acne",
   "poros"
  ],
  "funcion": "dureza y espuma (jabón)"
 },
 "GLYCINE SOJA OIL": {
  "nombre_com": "Aceite de soja",
  "categorias": [],
  "severidad": "verde",
  "nota": "Rico en linoleico (≈ 50–55 %), con oleico y algo de α-linolénico. Barato y neutro: con el girasol, la base de macerado más usada. Oxidable; figura con comedogenicidad 3/5 en la escala clásica.",
  "lactancia": "ok",
  "comedogenico": 3,
  "funcion": "vehículo; emoliente"
 },
 "JUGLANS REGIA SEED OIL": {
  "nombre_com": "Aceite de nuez",
  "categorias": [],
  "severidad": "verde",
  "nota": "Rico en linoleico (≈ 55–60 %) y α-linolénico (≈ 10–15 %): muy oxidable, se enrancia pronto. Emoliente para piel seca o madura en mezclas. Ojo con la alergia a frutos secos.",
  "lactancia": "ok",
  "funcion": "emoliente"
 },
 "RIBES NIGRUM SEED OIL": {
  "nombre_com": "Aceite de semilla de grosella negra",
  "categorias": [],
  "severidad": "verde",
  "nota": "Aporta ácido γ-linolénico (GLA, ≈ 15–19 %), α-linolénico y estearidónico, además de linoleico. Como la onagra y la borraja, se usa en piel seca, atópica o madura. Muy oxidable: en pequeña proporción y con antioxidante.",
  "lactancia": "ok",
  "funcion": "emoliente regenerador"
 },
 "ROSA RUBIGINOSA SEED OIL": {
  "nombre_com": "Aceite de rosa mosqueta",
  "categorias": [],
  "severidad": "verde",
  "nota": "Rico en linoleico (≈ 40–45 %) y α-linolénico (≈ 30–35 %), con carotenoides y tocoferoles. Clásico para cicatrices, estrías y piel madura o con manchas; es de los más oxidables (añadir al final y con antioxidante). Lo de que aporte «ácido retinoico» no está demostrado.",
  "lactancia": "ok",
  "funcion": "emoliente regenerador"
 },
 "SESAMUM INDICUM SEED OIL": {
  "nombre_com": "Aceite de sésamo",
  "categorias": [],
  "severidad": "verde",
  "nota": "Oleico y linoleico a partes casi iguales (≈ 40 % cada uno), con lignanos antioxidantes (sesamol, sesamina) que lo hacen bastante estable. Emoliente para piel normal o seca y buena base de macerado, aunque más cara.",
  "lactancia": "ok",
  "comedogenico": 2,
  "funcion": "vehículo; emoliente"
 },
 "ZEA MAYS GERM OIL": {
  "nombre_com": "Aceite de germen de maíz",
  "categorias": [],
  "severidad": "verde",
  "nota": "Rico en linoleico (≈ 50–60 %) y oleico. Barato, poco olor y color; base de oleatos. Figura con comedogenicidad 3/5 en la escala clásica.",
  "lactancia": "ok",
  "comedogenico": 3,
  "funcion": "vehículo; base de oleatos"
 },
 "HYDROGENATED SOYBEAN OIL": {
  "nombre_com": "Aceite de soja hidrogenado (cera de soja)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Aceite de soja hidrogenado: queda sólido (esteárico y palmítico). Es la «cera de soja» de velas y bálsamos: blanda, emoliente y poco oclusiva. La hidrogenación total no deja grasas trans; la parcial sí puede.",
  "lactancia": "ok",
  "funcion": "textura; emoliente"
 },
 "DAUCUS CAROTA SATIVA ROOT EXTRACT": {
  "nombre_com": "Macerado de raíz de zanahoria",
  "categorias": [],
  "severidad": "verde",
  "nota": "Normalmente es un macerado de raíz en aceite (en el INCI aparece también el aceite base): aporta carotenoides (β-caroteno) que le dan el color naranja y mancha. Emoliente antioxidante para piel seca y apagada; la piel convierte poco β-caroteno en vitamina A.",
  "lactancia": "ok",
  "funcion": "emoliente; aporta carotenoides"
 },
 "AMORPHOPHALLUS KONJAC ROOT POWDER": {
  "nombre_com": "Konjac en polvo",
  "categorias": [],
  "severidad": "verde",
  "nota": "Glucomanano del tubérculo de konjac: se hincha en agua y forma gel y película hidratante (alternativa vegetal al hialurónico, aunque retiene menos agua). También es la base de las esponjas de konjac.",
  "lactancia": "ok",
  "funcion": "gelificante; hidratante filmógeno"
 },
 "MARANTA ARUNDINACEA ROOT POWDER": {
  "nombre_com": "Almidón de arrurruz",
  "categorias": [],
  "severidad": "verde",
  "nota": "Almidón del rizoma de arrurruz. Espesa en caliente y, en polvo, absorbe grasa y humedad: se usa en polvos matificantes, champús secos y desodorantes. Muy bien tolerado.",
  "lactancia": "ok",
  "funcion": "espesante; absorbente en polvos"
 },
 "ACACIA CONCINNA FRUIT POWDER": {
  "nombre_com": "Shikakai en polvo",
  "categorias": [],
  "severidad": "verde",
  "nota": "Fruto de Acacia concinna molido, rico en saponinas: limpia suavemente y desenreda el pelo. Tradicional en la cosmética ayurvédica capilar; se usa en champús en polvo o sólidos y mascarillas.",
  "lactancia": "ok",
  "funcion": "limpiador suave (saponinas); acondicionador capilar"
 },
 "BAMBUSA ARUNDINACEA STEM POWDER": {
  "nombre_com": "Polvo de bambú",
  "categorias": [],
  "severidad": "verde",
  "nota": "Exfoliante físico (arrastre mecánico, no penetra). Rico en sílice; grano fino y redondeado según el proveedor. Para piel normal o grasa; en piel sensible o con rosácea, mejor exfoliantes más suaves.",
  "lactancia": "ok",
  "afecciones_relevantes": [
   "rosácea",
   "piel_sensible"
  ],
  "funcion": "exfoliante físico"
 },
 "COFFEA ARABICA SEED POWDER": {
  "nombre_com": "Café molido",
  "categorias": [],
  "severidad": "verde",
  "nota": "Exfoliante físico de grano medio, muy usado en exfoliantes corporales y anticelulíticos. Su cafeína apenas actúa en un producto que se aclara; el efecto es sobre todo de arrastre.",
  "lactancia": "ok",
  "afecciones_relevantes": [
   "rosácea",
   "piel_sensible"
  ],
  "funcion": "exfoliante físico"
 },
 "JUGLANS REGIA SHELL POWDER": {
  "nombre_com": "Polvo de cáscara de nuez",
  "categorias": [],
  "severidad": "verde",
  "nota": "Exfoliante físico de cáscara de nuez. Las partículas pueden ser angulosas: mejor en cuerpo o en grano muy fino; no en piel sensible, con rosácea o acné inflamado.",
  "lactancia": "ok",
  "afecciones_relevantes": [
   "rosácea",
   "piel_sensible",
   "acne"
  ],
  "funcion": "exfoliante físico"
 },
 "HIBISCUS SABDARIFFA FLOWER POWDER": {
  "nombre_com": "Hibisco en polvo",
  "categorias": [],
  "severidad": "verde",
  "nota": "Cáliz de hibisco molido: aporta antocianos (color rojo-violeta que cambia con el pH) y ácidos orgánicos. Se usa sobre todo como colorante natural en jabones, mascarillas y champús sólidos.",
  "lactancia": "ok",
  "funcion": "colorante natural"
 },
 "RUBUS IDAEUS FRUIT POWDER": {
  "nombre_com": "Polvo de frambuesa",
  "categorias": [],
  "severidad": "verde",
  "nota": "Fruta liofilizada en polvo: antocianos y polifenoles. En bálsamos labiales y exfoliantes da puntitos de color más que un color uniforme; uso sobre todo decorativo.",
  "lactancia": "ok",
  "funcion": "decorativo; colorante",
  "pct": "≈ 0,5 % (práctica del curso)"
 },
 "CAMELLIA SINENSIS LEAF WATER": {
  "nombre_com": "Hidrolato de té verde",
  "categorias": [],
  "severidad": "verde",
  "nota": "Agua de destilación de la hoja de té: aporta aroma y componentes volátiles, pero casi nada de catequinas (que no destilan). Úsalo como vehículo agradable, no como antioxidante.",
  "lactancia": "ok",
  "funcion": "vehículo"
 },
 "CUPRESSUS SEMPERVIRENS LEAF/NUT/STEM WATER": {
  "nombre_com": "Hidrolato de ciprés",
  "categorias": [],
  "severidad": "verde",
  "nota": "Hidrolato de ciprés: aroma resinoso y efecto astringente suave. Tradicional en piernas cansadas y piel grasa; su efecto «venotónico» no está demostrado por vía tópica.",
  "lactancia": "ok",
  "funcion": "vehículo; astringente suave"
 },
 "PELARGONIUM GRAVEOLENS FLOWER WATER": {
  "nombre_com": "Hidrolato de geranio",
  "categorias": [],
  "severidad": "verde",
  "nota": "Hidrolato de geranio: aroma floral y equilibrante. Lleva trazas de geraniol y citronelol (alérgenos), que pueden obligar a declararlos en la etiqueta según la dosis.",
  "lactancia": "ok",
  "funcion": "vehículo; aroma"
 },
 "ANIBA ROSAEODORA WOOD OIL": {
  "nombre_com": "Aceite esencial de palo de rosa",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "verde",
  "nota": "No es un ingrediente peligroso para la piel: es muy rico en linalol (≈ 80–90 %), que solo sensibiliza cuando se oxida (usarlo fresco). Pero el palo de rosa es una especie amenazada (Lista Roja de la UICN; comercio regulado por CITES) y COSMOS no lo admite, así que mejor no usarlo en GAROA: la madera de Ho tiene una composición parecida y es sostenible. Lo de que sea «reafirmante» no tiene pruebas.",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "aroma"
 },
 "CINNAMOMUM CAMPHORA LINALOOLIFERA WOOD OIL": {
  "nombre_com": "Aceite esencial de madera de Ho",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "verde",
  "nota": "Alcanforero de quimiotipo linalol: ≈ 80–95 % de linalol, con muy poco alcanfor. Es el sustituto sostenible del palo de rosa. Aroma floral-amaderado suave; usarlo fresco y con antioxidante, porque el linalol oxidado sensibiliza.",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "aroma"
 },
 "CITRUS AURANTIUM AMARA FLOWER OIL": {
  "nombre_com": "Aceite esencial de neroli (azahar)",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "verde",
  "nota": "Destilado de la flor del naranjo amargo: linalol, acetato de linalilo, limoneno, nerolidol. Al ser de flor y destilado, no es fototóxico. Aroma muy apreciado y caro; se usa a dosis muy bajas (en el curso, 0,1 %).",
  "lactancia": "ok",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "aroma",
  "pct": "≈ 0,1 % (práctica del curso)"
 },
 "CITRUS NOBILIS PEEL OIL": {
  "nombre_com": "Aceite esencial de mandarina",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "verde",
  "nota": "Exprimido de la cáscara de mandarina: rico en limoneno (≈ 65–75 %) y γ-terpineno. Tiene muy poco bergapteno y no se considera fototóxico (al contrario que la bergamota, el limón o la lima exprimidos; comprobar el certificado IFRA del lote). El limoneno oxidado sensibiliza.",
  "lactancia": "ok",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "aroma"
 },
 "MENTHA ARVENSIS LEAF OIL": {
  "nombre_com": "Aceite esencial de menta japonesa",
  "categorias": [
   "fragrance_ae",
   "irritante"
  ],
  "severidad": "amarillo",
  "nota": "Amarillo por precaución, igual que la menta piperita: es natural, pero su mentol puede irritar. Menta japonesa: muy rica en mentol (≈ 70–80 %), con mentona. Frescor intenso (activa el receptor del frío TRPM8). No usar en bebés ni niños pequeños ni cerca de su cara; puede desencadenar rojeces en rosácea y piel sensible.",
  "lactancia": "precaucion",
  "afecciones_relevantes": [
   "rosácea",
   "piel_sensible",
   "dermatitis"
  ],
  "funcion": "frescor; aroma",
  "pct": "0,5–1 % (prácticas del curso)"
 },
 "MENTHA SPICATA HERB OIL": {
  "nombre_com": "Aceite esencial de hierbabuena",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "verde",
  "nota": "Hierbabuena (Mentha spicata, sinónimo M. viridis): su componente principal es la carvona (≈ 55–70 %), con limoneno y muy poco mentol. Frescor más suave y dulce que la menta piperita.",
  "lactancia": "precaucion",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "aroma; frescor suave",
  "pct": "0,3–1 % (prácticas del curso)"
 },
 "HELICHRYSUM ITALICUM FLOWER OIL": {
  "nombre_com": "Aceite esencial de siempreviva (helicriso)",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "verde",
  "nota": "Rico en acetato de nerilo y en dicetonas propias (italidionas). Tradicional para hematomas y cicatrices; la evidencia es sobre todo de uso tradicional y estudios de laboratorio. Muy caro: se usa a dosis bajas.",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "aroma; calmante (tradicional)"
 },
 "ROSMARINUS OFFICINALIS LEAF OIL": {
  "nombre_com": "Aceite esencial de romero",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "amarillo",
  "nota": "Amarillo por precaución, igual que el aceite esencial de romero: es natural, pero puede irritar la piel sensible y empeorar la rosácea, y el alcanfor pide cuidado en embarazo y epilepsia. Su composición depende del quimiotipo (cineol, alcanfor o verbenona): sobre todo 1,8-cineol, alcanfor, α-pineno y acetato de bornilo. Aroma y frescor; no protege la fórmula como el extracto antioxidante. Los quimiotipos ricos en alcanfor no se recomiendan en embarazo, lactancia, niños pequeños ni epilepsia.",
  "lactancia": "precaucion",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "aroma",
  "pct": "≈ 0,5 % (práctica del curso)"
 },
 "ROSA CENTIFOLIA FLOWER CERA": {
  "nombre_com": "Cera floral de rosa centifolia",
  "categorias": [
   "fragrance_ae"
  ],
  "severidad": "verde",
  "nota": "Cera que queda del concreto de rosa (funde a ≈ 60–70 °C): da consistencia y un aroma suave. El concreto suele extraerse con hexano y lleva alérgenos de fragancia (geraniol, citronelol…) que pueden tener que declararse.",
  "afecciones_relevantes": [
   "dermatitis",
   "piel_sensible"
  ],
  "funcion": "consistencia; aroma",
  "pct": "≈ 0,8 % (práctica del curso)"
 },
 "AVENA SATIVA KERNEL EXTRACT": {
  "nombre_com": "Extracto de avena",
  "categorias": [],
  "severidad": "verde",
  "nota": "Aporta avenantramidas (polifenoles antiinflamatorios y antipruriginosos propios de la avena) y betaglucanos filmógenos. Uno de los calmantes mejor documentados: piel seca, atópica, irritada o con picor.",
  "lactancia": "ok",
  "funcion": "calmante; antiprurito",
  "pct": "≈ 1 % (práctica del curso)"
 },
 "CUCUMIS SATIVUS FRUIT EXTRACT": {
  "nombre_com": "Extracto de pepino",
  "categorias": [],
  "severidad": "verde",
  "nota": "Extracto acuoso o hidroglicerinado de pepino: refrescante y calmante suave (agua, azúcares, aminoácidos, algo de vitamina C). Bien tolerado en piel sensible. Lo de «blanqueador» o «antibolsas» tiene poco respaldo.",
  "lactancia": "ok",
  "funcion": "calmante, refrescante",
  "pct": "≈ 4 % (prácticas del curso)"
 },
 "MALVA SYLVESTRIS EXTRACT": {
  "nombre_com": "Extracto de malva",
  "categorias": [],
  "severidad": "verde",
  "nota": "Rico en mucílagos (polisacáridos) que forman una película calmante e hidratante. Muy adecuado en piel sensible, irritada o tras el afeitado. También existe como hidrolato.",
  "lactancia": "ok",
  "funcion": "calmante; hidratante filmógeno",
  "pct": "5–8 % (prácticas del curso)"
 },
 "ROSA CENTIFOLIA FLOWER EXTRACT": {
  "nombre_com": "Extracto de rosa centifolia",
  "categorias": [],
  "severidad": "verde",
  "nota": "Extracto (a menudo hidroglicerinado) de pétalos de rosa: polifenoles y aroma suave. Calmante y astringente ligero; agradable en brumas y tónicos para piel sensible.",
  "lactancia": "ok",
  "funcion": "calmante; aroma",
  "pct": "≈ 8 % (práctica del curso)"
 },
 "SALVIA OFFICINALIS LEAF EXTRACT": {
  "nombre_com": "Extracto de salvia",
  "categorias": [],
  "severidad": "verde",
  "nota": "Taninos y ácido rosmarínico (y algo de carnosol): astringente y antioxidante, útil en piel grasa y limpiadores. Los taninos se oscurecen con trazas de hierro. La tuyona de la salvia está sobre todo en el aceite esencial, no en el extracto acuoso.",
  "lactancia": "precaucion",
  "funcion": "astringente; antioxidante",
  "pct": "3–4 % (prácticas del curso)"
 },
 "URTICA DIOICA LEAF EXTRACT": {
  "nombre_com": "Extracto de ortiga",
  "categorias": [],
  "severidad": "verde",
  "nota": "Flavonoides, minerales y clorofila. Tradicional en piel grasa y cuero cabelludo graso; lo de que «regule la grasa» procede del curso y de la tradición, con poca evidencia clínica.",
  "lactancia": "ok",
  "funcion": "activo para piel grasa (tradicional)"
 },
 "ECHINACEA ANGUSTIFOLIA EXTRACT": {
  "nombre_com": "Extracto de equinácea",
  "categorias": [],
  "severidad": "verde",
  "nota": "Equinácea: alcamidas y derivados del ácido cafeico (equinacósido). Se usa como calmante y «protector del ácido hialurónico» (inhibe la hialuronidasa en ensayos de laboratorio de proveedor: evidencia débil). Es una compuesta: precaución si hay alergia a manzanilla o árnica.",
  "afecciones_relevantes": [
   "dermatitis"
  ],
  "funcion": "calmante; protector de la matriz (in vitro)"
 },
 "ACACIA DEALBATA EXTRACT": {
  "nombre_com": "Extracto de mimosa",
  "categorias": [],
  "severidad": "verde",
  "nota": "Extracto de mimosa: polifenoles. Como la equinácea, se vende como «protector de los GAG» con ensayos de laboratorio de proveedor (evidencia débil). Distinto del absoluto de mimosa usado en perfumería, que lleva alérgenos.",
  "funcion": "activo hidratante (in vitro)"
 },
 "AESCULUS HIPPOCASTANUM SEED EXTRACT": {
  "nombre_com": "Extracto de castaño de Indias",
  "categorias": [],
  "severidad": "verde",
  "nota": "Aporta escina (saponina venotónica) y taninos. Clásico en geles de piernas cansadas; la evidencia sólida de la escina es por vía oral en insuficiencia venosa, la tópica es modesta.",
  "funcion": "activo circulatorio",
  "pct": "≈ 2 % (práctica del curso)"
 },
 "RUSCUS ACULEATUS ROOT EXTRACT": {
  "nombre_com": "Extracto de rusco",
  "categorias": [],
  "severidad": "verde",
  "nota": "Rico en ruscogeninas (saponinas esteroideas) venotónicas. Se usa en piernas cansadas y contorno de ojos; la evidencia es sobre todo por vía oral.",
  "funcion": "activo circulatorio"
 },
 "VITIS VINIFERA LEAF EXTRACT": {
  "nombre_com": "Extracto de hoja de vid roja",
  "categorias": [],
  "severidad": "verde",
  "nota": "Flavonoides (quercetina) y antocianos de la hoja de vid roja: venotónico (evidencia sobre todo oral) y antioxidante. Para piernas cansadas.",
  "funcion": "activo circulatorio; antioxidante"
 },
 "HEDERA HELIX LEAF EXTRACT": {
  "nombre_com": "Extracto de hiedra",
  "categorias": [],
  "severidad": "verde",
  "nota": "Saponinas (hederacósidos). Se usa en anticelulíticos y geles de piernas como «circulatorio», con poca evidencia. La planta fresca puede dar dermatitis de contacto (falcarinol); en extracto se tolera mejor, pero precaución en piel sensible.",
  "afecciones_relevantes": [
   "piel_sensible",
   "dermatitis"
  ],
  "funcion": "activo circulatorio (tradicional)",
  "pct": "≈ 3 % (práctica del curso)"
 },
 "ILEX PARAGUARIENSIS LEAF EXTRACT": {
  "nombre_com": "Extracto de mate",
  "categorias": [],
  "severidad": "verde",
  "nota": "Hoja de yerba mate: cafeína (metilxantinas) y ácidos clorogénicos. Se usa en anticelulíticos por la cafeína (lipólisis) y como antioxidante.",
  "funcion": "activo anticelulítico; antioxidante"
 },
 "PAULLINIA CUPANA SEED EXTRACT": {
  "nombre_com": "Extracto de guaraná",
  "categorias": [],
  "severidad": "verde",
  "nota": "Semilla de guaraná, de las más ricas en cafeína (≈ 3–6 %), además de taninos. Activo anticelulítico y descongestionante por su cafeína; efecto tópico modesto.",
  "funcion": "activo anticelulítico"
 },
 "GARCINIA CAMBOGIA FRUIT EXTRACT": {
  "nombre_com": "Extracto de garcinia",
  "categorias": [],
  "severidad": "verde",
  "nota": "Aporta ácido hidroxicítrico. Se vende como anticelulítico, pero la evidencia oral es débil y la tópica prácticamente nula.",
  "funcion": "activo anticelulítico (evidencia débil)"
 },
 "PANAX GINSENG ROOT EXTRACT": {
  "nombre_com": "Extracto de ginseng",
  "categorias": [],
  "severidad": "verde",
  "nota": "Raíz de ginseng: ginsenósidos (saponinas) y polisacáridos. Antioxidante y «revitalizante» en piel cansada o madura; la evidencia es sobre todo de laboratorio y de estudios pequeños.",
  "funcion": "activo antioxidante",
  "pct": "≈ 4 % (práctica del curso)"
 },
 "GLYCINE SOJA SEED EXTRACT": {
  "nombre_com": "Extracto de semilla de soja",
  "categorias": [],
  "severidad": "verde",
  "nota": "Aporta isoflavonas (genisteína, daidzeína), antioxidantes frente al daño por UV, y en algunos extractos inhibidores de proteasas que se estudian para el tono irregular. Evidencia tópica moderada.",
  "funcion": "antioxidante"
 },
 "PUNICA GRANATUM EXTRACT": {
  "nombre_com": "Extracto de granada",
  "categorias": [],
  "severidad": "verde",
  "nota": "Rico en punicalaginas, ácido elágico y antocianos: antioxidante, con estudios frente al daño por UVB (sobre todo de laboratorio). Útil en piel madura o apagada.",
  "lactancia": "ok",
  "funcion": "antioxidante"
 },
 "POLYGONUM CUSPIDATUM ROOT EXTRACT": {
  "nombre_com": "Extracto de raíz de Polygonum (fuente de resveratrol)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Raíz de Fallopia japonica, la principal fuente comercial de resveratrol (riqueza del 10 al 99 % según el extracto: pide el certificado). Antioxidante; el resveratrol se degrada con la luz (envase opaco).",
  "funcion": "antioxidante (resveratrol)"
 },
 "SILYBUM MARIANUM FRUIT EXTRACT": {
  "nombre_com": "Extracto de cardo mariano",
  "categorias": [],
  "severidad": "verde",
  "nota": "Aporta silimarina (mezcla de flavonolignanos, sobre todo silibina): antioxidante, con estudios de protección del ADN frente a UVB (laboratorio y animales). Para piel madura o expuesta al sol.",
  "lactancia": "ok",
  "funcion": "antioxidante"
 },
 "COFFEA ARABICA FRUIT EXTRACT": {
  "nombre_com": "Extracto de fruto (baya) de café",
  "categorias": [],
  "severidad": "verde",
  "nota": "Extracto de la baya entera del café: ácidos clorogénico y ferúlico, antocianos. Antioxidante, propuesto frente al envejecimiento por UV (estudios de proveedor). No equivale a la cafeína del grano.",
  "funcion": "antioxidante"
 },
 "EQUISETUM ARVENSE EXTRACT": {
  "nombre_com": "Extracto de cola de caballo",
  "categorias": [],
  "severidad": "verde",
  "nota": "Rico en sílice y flavonoides; astringente suave. Lo de que el silicio «reconstruya las fibras» no tiene base: no se le conoce función enzimática y la evidencia tópica es débil. No sustituye a un conservante.",
  "funcion": "astringente suave"
 },
 "SANTOLINA CHAMAECYPARISSUS FLOWER EXTRACT": {
  "nombre_com": "Extracto de santolina",
  "categorias": [],
  "severidad": "verde",
  "nota": "Santolina (abrótano hembra), compuesta aromática mediterránea. En el curso aparece por error de transcripción en lugar de la manzanilla del macerado. Precaución si hay alergia a las compuestas.",
  "afecciones_relevantes": [
   "dermatitis"
  ],
  "funcion": "extracto vegetal (aroma, calmante)"
 },
 "LAMINARIA DIGITATA EXTRACT": {
  "nombre_com": "Extracto de laminaria (alga parda)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Alga parda rica en alginatos, laminarina, minerales y yodo. Hidratante filmógena; se usa en anticelulíticos y «drenantes» (efectos sobre todo de estudios de proveedor). Por el yodo, precaución en productos corporales extensos de uso diario.",
  "lactancia": "precaucion",
  "funcion": "hidratante filmógeno; activo anticelulítico"
 },
 "ASPARAGOPSIS ARMATA EXTRACT": {
  "nombre_com": "Extracto de Asparagopsis (alga roja)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Alga roja con polisacáridos y compuestos antimicrobianos. Se usa como calmante e «inmunomodulador» en piel sensible, según estudios de proveedor.",
  "funcion": "calmante"
 },
 "ENTEROMORPHA COMPRESSA EXTRACT": {
  "nombre_com": "Extracto de Enteromorpha (alga verde)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Alga verde rica en ulvanos (polisacáridos) y minerales: hidratante filmógena y calmante. Funciones específicas basadas sobre todo en estudios de proveedor.",
  "funcion": "hidratante filmógeno; calmante"
 },
 "CORALLINA OFFICINALIS EXTRACT": {
  "nombre_com": "Extracto de coralina (alga roja calcárea)",
  "categorias": [],
  "severidad": "verde",
  "nota": "Alga roja calcárea: aporta sobre todo minerales (carbonatos de calcio y magnesio). Se vende como remineralizante o anticelulítico, con respaldo débil.",
  "funcion": "activo mineralizante (marketing)"
 }
};
const ALIAS_VEGETALES_V3 = {
 "HAMAMELIS VIRGINIANA LEAF WATER": "HAMAMELIS VIRGINIANA WATER",
 "JASMINUM GRANDIFLORUM/OFFICINALE FLOWER EXTRACT": "JASMINUM GRANDIFLORUM FLOWER EXTRACT",
 "CUPRESSUS SEMPERVIRENS LEAF WATER": "CUPRESSUS SEMPERVIRENS LEAF/NUT/STEM WATER",
 "PELARGONIUM GRAVEOLENS FLOWER/LEAF/STEM WATER": "PELARGONIUM GRAVEOLENS FLOWER WATER",
 "CINNAMOMUM CAMPHORA LINALOOLIFERA LEAF OIL": "CINNAMOMUM CAMPHORA LINALOOLIFERA WOOD OIL",
 "CITRUS RETICULATA PEEL OIL": "CITRUS NOBILIS PEEL OIL",
 "MENTHA VIRIDIS LEAF OIL": "MENTHA SPICATA HERB OIL",
 "MENTHA SPICATA LEAF OIL": "MENTHA SPICATA HERB OIL",
 "MENTHA VIRIDIS OIL": "MENTHA SPICATA HERB OIL",
 "SALVIA ROSMARINUS LEAF OIL": "ROSMARINUS OFFICINALIS LEAF OIL",
 "MALVA SYLVESTRIS FLOWER/LEAF EXTRACT": "MALVA SYLVESTRIS EXTRACT",
 "MALVA SYLVESTRIS LEAF EXTRACT": "MALVA SYLVESTRIS EXTRACT",
 "MALVA SYLVESTRIS FLOWER EXTRACT": "MALVA SYLVESTRIS EXTRACT",
 "PUNICA GRANATUM FRUIT EXTRACT": "PUNICA GRANATUM EXTRACT"
};
Object.entries(DB_VEGETALES_V3).forEach(([k, v]) => { if (!INCI_DB[k]) INCI_DB[k] = v; });
Object.entries(ALIAS_VEGETALES_V3).forEach(([k, v]) => { if (!INCI_DB[k]) INCI_DB[k] = { alias: v }; });
// ── Base única 16/11/2026: fichas que solo tenía la base antigua de asesorías (se añaden solo si faltan) ──
// Mismo dato y color que tenían allí; afecciones pasadas al vocabulario de esta base (rosácea, piel_sensible, piel_seca).
const DB_RESCATE_ASESORIAS = {
  'POLYGLYCERYL-3 DISTEARATE': { nombre_com:'Poliglicerilo-3 diestearato', categorias:[], severidad:'verde', nota:'Emulsionante vegetal derivado de glicerina poliglicerolada y ácido esteárico. Habitual en sistemas de emulsión de cosmética natural y orgánica certificada.', lactancia:'ok' },
  'ECTOIN': { nombre_com:'Ectoína', categorias:[], severidad:'verde', nota:'Uso: "extremolito" obtenido por fermentación de bacterias que viven en ambientes muy salinos — estas moléculas les permiten sobrevivir a la deshidratación, y aplicadas sobre la piel protegen las células del estrés osmótico y ayudan a reparar la barrera cutánea. Se usa como hidratante y protector celular (frente a contaminación, luz azul) hasta un 7% en fórmula. Riesgo: perfil de seguridad muy bueno, no irritante ni sensibilizante, apta para piel sensible o reactiva. Al obtenerse por fermentación (no de síntesis petroquímica), está aceptada en cosmética natural — con certificaciones COSMOS, NATRUE y Ecocert disponibles.', lactancia:'ok', afecciones_utiles:['piel_sensible','piel_seca','rosácea'] },
  'AVENA SATIVA KERNEL FLOUR': { nombre_com:'Avena coloidal (harina de avena)', categorias:[], severidad:'verde', nota:'Uso: uno de los pocos ingredientes reconocidos oficialmente por la FDA como "protector cutáneo" (desde 2003), con más de 50 años de uso dermatológico documentado en dermatitis atópica, psoriasis y piel de bebé. Contiene avenantramidas (antiinflamatorias, calman el picor), betaglucanos (forman película e hidratan) y saponinas (limpieza suave). Riesgo: excelente perfil de seguridad, hipoalergénica en la gran mayoría de los casos — la alergia a la avena existe pero es mucho más frecuente por vía oral/inhalada que por vía tópica; precaución solo si hay alergia conocida a la avena.', lactancia:'ok', afecciones_utiles:['piel_sensible','dermatitis','piel_seca'] },
};
const ALIAS_RESCATE_ASESORIAS = { 'ECTOINE':'ECTOIN', 'CERAMIDE 1':'CERAMIDE NP', 'CERAMIDE 2':'CERAMIDE NP', 'CERAMIDE 3':'CERAMIDE NP', 'CERAMIDE 6 II':'CERAMIDE NP', 'COLLOIDAL OATMEAL':'AVENA SATIVA KERNEL FLOUR' };
Object.entries(DB_RESCATE_ASESORIAS).forEach(([k, v]) => { if (!INCI_DB[k]) INCI_DB[k] = v; });
Object.entries(ALIAS_RESCATE_ASESORIAS).forEach(([k, v]) => { if (!INCI_DB[k]) INCI_DB[k] = { alias: v }; });
// Decisión de Sarai 16/11/2026: origen habitual petroquímico y sin grados aprobados por COSMOS → amarillo
['ALLANTOIN','HYDROXYETHYLCELLULOSE','HYDROXYPROPYL METHYLCELLULOSE','MANDELIC ACID','TRISODIUM ETHYLENEDIAMINE DISUCCINATE',
 'SODIUM METHYL COCOYL TAURATE','SODIUM LAUROYL METHYL ISETHIONATE','SODIUM LAUROYL ISETHIONATE','SODIUM ISETHIONATE',
 'SODIUM LAUROYL SARCOSINATE','SODIUM COCOYL SARCOSINATE'].forEach(k => {
  const e = INCI_DB[k]; if (!e || e.alias) return;
  e.severidad = 'amarillo';
  if (!(e.categorias || []).includes('no_cosmetica_natural')) e.categorias = [...(e.categorias || []), 'no_cosmetica_natural'];
});
// ── Fin ampliación 16/11/2026 ──
// Decisión de Sarai 22/11/2026: los aceites esenciales SÍ son GAROA → siempre verde, con aviso de cuidado
// (dependen de la piel). Se marcan con aceite_esencial:true para mostrarlos en «Natural, pero ojo con tu piel».
Object.values(INCI_DB).forEach(e => {
  if (!e || e.alias || !/^aceite esencial/i.test(e.nombre_com || '')) return;
  e.severidad = 'verde';
  e.aceite_esencial = true;
});

// ── Reglas por familia (para lo que no está en la base) — copiado de plantilla.html ──
const MINERAL_CI = new Set(["75100", "75130", "75300", "75470", "75810", "77000", "77004", "77007", "77019", "77120", "77163", "77266", "77288", "77289", "77400", "77480", "77491", "77492", "77499", "77510", "77713", "77742", "77820", "77891", "77947"]);
const QUIM = /^(SODIUM|POTASSIUM|MAGNESIUM|CALCIUM|ZINC|AMMONIUM|DISODIUM|TRISODIUM|TETRASODIUM|PEG|PPG|GLYCERYL|POLYGLYCERYL|CETEARYL|CETYL|STEARYL|ISOPROPYL|ETHYLHEXYL|MINERAL|PARAFFINUM|HYDROXY|METHYL|ETHYL|BUTYL|PROPYL|LAURYL|COCO[- ]|DECYL|CAPRYLIC|C\d)/;
const BOT_FIN = /\b(EXTRACT|OIL|BUTTER|WAX|JUICE|WATER|POWDER|FLOWER|LEAF|SEED|ROOT|PEEL|FRUIT|KERNEL|BARK|HYDROSOL|DISTILLATE|FERMENT)\b/;
function regla(n) {
  const r = (sev, cat, nota) => ({ severidad: sev, categorias: cat ? [cat] : [], nota, porFamilia: true });
  if (/PARABEN/.test(n)) return r('rojo', 'conservante_controvertido', 'Parabeno. Algunos (propil-, butil-) tienen límites por su posible efecto hormonal y otros están prohibidos en la UE.');
  if (/^(PEG|PPG)-\d|^POLYETHYLENE GLYCOL|\b(LAURETH|CETEARETH|STEARETH|CETETH|OLETH|TRIDECETH|PARETH|CETOLETH|POLOXAMER|POLYSORBATE)\b|ETH-\d+/.test(n))
    return r('amarillo', 'petroquimico', 'Ingrediente etoxilado (familia PEG/«-eth»): se obtiene con óxido de etileno, de origen petroquímico. Inocuo en cosmética, pero no entra en GAROA.');
  if (/(SILOXANE|CONE$|CONOL|SILSESQUIOXANE|SILICONE|SILANE|DIMETHICONE)/.test(n) && !/SILICA/.test(n))
    return r('amarillo', 'silicona', 'Silicona. Da tacto sedoso pero no aporta a la piel y es muy persistente en el medio ambiente. No entra en GAROA.');
  if (/(ACRYLATE|ACRYLAMIDE|POLYACRYLOYL|CARBOMER|NYLON|POLYETHYLENE|POLYPROPYLENE|POLYMETHYL|POLYURETHANE|POLYSTYRENE|POLYISOBUTENE|POLYBUTENE|POLYDECENE|VP\/|PVP|STYRENE|COPOLYMER|CROSSPOLYMER)/.test(n))
    return r('amarillo', 'petroquimico', 'Polímero sintético (textura, película o espesante). De origen petroquímico. No entra en GAROA.');
  if (/POLYQUATERNIUM|QUATERNIUM-\d/.test(n)) return r('amarillo', 'petroquimico', 'Polímero catiónico sintético (acondicionador). De origen petroquímico. No entra en GAROA.');
  if (/(PARAFFIN|PETROLATUM|MINERAL OIL|CERESIN|MICROCRYSTALLINE|OZOKERITE|ISODODECANE|ISOHEXADECANE|ISOEICOSANE|ISOPARAFFIN)/.test(n))
    return r('amarillo', 'derivado_petroleo', 'Derivado del petróleo (aceite o cera mineral). Inocuo en la piel, pero no entra en GAROA.');
  const ci = n.match(/^CI\s*(\d{5})$/);
  if (ci) return MINERAL_CI.has(ci[1]) ? r('verde', '', 'Pigmento mineral o de origen natural (colorante CI).')
                                       : r('amarillo', 'no_cosmetica_natural', 'Colorante sintético (CI). Autorizado en la UE, pero no se acepta en cosmética natural.');
  if (BOT_FIN.test(n) && !QUIM.test(n) && n.split(' ').length >= 2 && !/(PEG|PPG|SULFATE|ETH-)/.test(n)) {
    if (/\b(PEEL|LEAF|FLOWER|HERB|BARK|WOOD|ROOT)\s+OIL\b/.test(n)) return { ...r('verde', 'fragrance_ae', 'Aceite esencial de origen vegetal. Aporta aroma; en pieles reactivas puede ser sensibilizante.'), aceite_esencial: true };
    return r('verde', '', 'Ingrediente de origen vegetal (extracto, aceite, manteca o agua floral).');
  }
  return null;
}

// ── Corrector de erratas — copiado de plantilla.html ──
function distancia(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return d[a.length][b.length];
}
// ── Fin ampliación 2/11/2026 ──

function checkPEG(nombre) {
  if (/^PEG-\d/.test(nombre) || /^POLYETHYLENE GLYCOL/.test(nombre)) {
    return {
      nombre_com: nombre + ' (PEG)',
      categorias: ['petroquimico'],
      severidad: 'amarillo',
      nota: 'Polietilenglicol de síntesis petroquímica. Actúa como penetration enhancer (puede facilitar la entrada de otros ingredientes en la piel). Puede contener 1,4-dioxano como contaminante del proceso de fabricación.',
      lactancia: 'precaucion',
    };
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// ETIQUETAS LEGIBLES POR CATEGORÍA
// ══════════════════════════════════════════════════════════════════════════════
const CAT_LABELS = {
  fragrance_ae:              'Alérgeno AE · natural',
  fragrance_sintetica:       'Fragancia sintética',
  no_cosmetica_natural:      'No aceptado cosmética natural',
  disruptor_endocrino:       'Disruptor endocrino',
  formaldehido_liberador:    'Libera formaldehído',
  derivado_petroleo:         'Derivado del petróleo',
  silicona:                  'Silicona',
  alcohol_desecante:         'Alcohol desecante',
  conservante_controvertido: 'Conservante controversia',
  comedogenico:              'Comedogénico',
  sulfato:                   'Sulfato',
  irritante:                 'Irritante',
  petroquimico:              'Petroquímico / Polímero',
};

const LACTANCIA_LABELS = { ok:'✓ Sin restricción en lactancia', precaucion:'⚠ Precaución en lactancia', evitar:'✗ Evitar en embarazo y lactancia' };

// La ficha de asesorías y esta herramienta nombran distinto las afecciones (2/11/2026).
// Traduce las palabras de la ficha a las que usa INCI_DB, sin tocar los datos guardados.
const TRADUCCION_AFECCIONES = { rosacea: 'rosácea', acne_activo: 'acne', acneica: 'acne', hiperpigmentacion: 'manchas', sensible: 'piel_sensible', seca: 'piel_seca' };
function traducirClienta(c) {
  if (!c) return c;
  const af = new Set(), ciclo = new Set(c.ciclo || []);
  (c.afecciones || []).forEach(a => {
    if (a === 'embarazo' || a === 'lactancia') ciclo.add(a);
    else af.add(TRADUCCION_AFECCIONES[a] || a);
  });
  (c.pieles || []).forEach(p => { if (TRADUCCION_AFECCIONES[p]) af.add(TRADUCCION_AFECCIONES[p]); });
  return { ...c, afecciones: [...af], ciclo: [...ciclo] };
}

// ══════════════════════════════════════════════════════════════════════════════
// PARSER INCI
// ══════════════════════════════════════════════════════════════════════════════
function limpiarNombreINCI(raw) {
  return raw.replace(/§/g, ',') // coma entre dígitos protegida («1,2-HEXANEDIOL»)
            .replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '')
            .replace(/\s*\/\s*/g, '/').replace(/\s+/g, ' ')
            .trim().toUpperCase()
            .replace(/\s*[\*\.°]+\s*$/, '').trim(); // quita * . ° finales (marcas orgánico/eco)
}

// Prepara el texto: quita «INGREDIENTS:»/«INGREDIENTES:» del principio y protege las comas entre dígitos
function prepararTextoINCI(texto) {
  return texto
    .replace(/^\s*(INGR[EÉ]DIENT(E|ES|S)?|COMPOSICI[OÓ]N|INCI)\s*[:\/]\s*/i, '')
    .replace(/(\d),(\d)/g, '$1§$2');
}

function parseINCI(texto) {
  const seen = new Set();
  return prepararTextoINCI(texto).split(/[,\n;]/).map(limpiarNombreINCI)
    .filter(i => i.length > 1)
    .filter(i => { if (seen.has(i)) return false; seen.add(i); return true; });
}

function parseINCI_organicos(texto) {
  // Devuelve Set con los nombres limpios que llevaban * en el INCI (certificado orgánico)
  const s = new Set();
  prepararTextoINCI(texto).split(/[,\n;]/).forEach(i => {
    const raw = limpiarNombreINCI(i.replace(/[\*°]+(?=\s*$)/, ''));
    if (/[\*°]/.test(i.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, ''))) s.add(raw);
  });
  return s;
}

function resolverAlias(nombre) {
  // Orden (igual que lee-la-etiqueta.html): base/alias → partes con «/» → PEG → reglas por familia → erratas
  const directo = k => {
    const e = INCI_DB[k];
    if (!e) return null;
    if (e.alias) {
      // Sigue alias encadenados (16/11/2026: «PARAFINIUM LIQUIDIUM» → «PARAFFINUM LIQUIDUM» → «MINERAL OIL»)
      let base = e.alias, d = INCI_DB[base], saltos = 0;
      while (d && d.alias && saltos++ < 5) { base = d.alias; d = INCI_DB[base]; }
      return d && !d.alias ? { nombre, data: d, nombreBase: base } : null;
    }
    return { nombre, data: e, nombreBase: k };
  };
  let r = directo(nombre);
  if (r) return r;
  const partes = nombre.split('/').map(p => p.trim()).filter(Boolean);
  if (partes.length > 1) for (const p of partes) { r = directo(p); if (r) return r; }
  const peg = checkPEG(nombre);
  if (peg) return { nombre, data: peg, nombreBase: nombre };
  for (const p of [nombre, ...(partes.length > 1 ? partes : [])]) {
    const f = regla(p);
    if (f) return { nombre, data: f, nombreBase: p };
  }
  if (nombre.length >= 7) {
    let mejor = null, md = 3;
    for (const k of Object.keys(INCI_DB)) { const dd = distancia(nombre, k); if (dd < md) { md = dd; mejor = k; if (dd === 1) break; } }
    if (mejor && md <= (nombre.length >= 12 ? 2 : 1)) { r = directo(mejor); if (r) return { ...r, data: { ...r.data, nombre_com: (r.data.nombre_com || r.nombreBase) + ' (posible errata)' }, errata: true }; }
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// LÓGICA DE ANÁLISIS Y PERSONALIZACIÓN
// ══════════════════════════════════════════════════════════════════════════════
function calcularSeveridadPersonalizada(data, clienta, ingredientesList) {
  const cats = data.categorias || [];

  // Siempre rojo sin excepción: disruptores endocrinos, liberadores de formaldehído, fragrance_sintetica
  if (cats.includes('disruptor_endocrino')) return 'rojo';
  if (cats.includes('formaldehido_liberador')) return 'rojo';
  // fragrance_sintetica: la DB ya pone rojo/amarillo; respetamos ese valor salvo que haya clienta
  // (desde 2/11/2026 PARFUM es amarillo en DB: inocuo pero sintético; rojo = posible riesgo para la salud)

  // Lógica especial fragrance_ae: verde por defecto SALVO que haya PARFUM en el INCI
  // o que la clienta tenga barrera comprometida (dermatitis / piel_sensible)
  if (cats.includes('fragrance_ae') && data.severidad === 'verde') {
    const tienePARFUM = (ingredientesList || []).some(i => ['PARFUM','FRAGRANCE','AROMA'].includes(i));
    if (tienePARFUM) return 'amarillo';
    const afecciones = clienta ? (clienta.afecciones || []) : [];
    if (afecciones.includes('dermatitis') || afecciones.includes('piel_sensible')) return 'amarillo';
    return 'verde';
  }

  if (!clienta) return data.severidad;
  const afecciones = clienta.afecciones || [];
  const ciclo = clienta.ciclo || [];
  const embarazo = ciclo.includes('embarazo');
  const lactancia_real = ciclo.includes('lactancia');

  // Embarazo/lactancia + evitar → rojo
  if ((embarazo || lactancia_real) && data.lactancia === 'evitar') return 'rojo';

  // Afecciones relevantes presentes en la clienta: subir amarillo → rojo
  const relevantes = data.afecciones_relevantes || [];
  const coincide = relevantes.some(a => afecciones.includes(a));
  if (coincide && data.severidad === 'amarillo') return 'rojo';

  // Comedogénico ≥ 4 + acné
  if ((data.comedogenico || 0) >= 4 && afecciones.includes('acne')) return 'rojo';

  return data.severidad;
}

// Etiqueta para la clienta (18/11/2026, criterio de Sarai). El color del ingrediente
// no cambia por ser útil; la etiqueta va aparte:
//   verde    → le viene bien y cumple el criterio GAROA (no sintético/petroquímico, aunque sea amarillo por irritante)
//   amarillo → le viene bien, pero no cumple el criterio GAROA (y lo dice)
//   rojo     → cuidado: le puede ir mal (afecciones_relevantes, embarazo/lactancia, comedogénico + acné)
// afecciones_utiles = le viene bien · afecciones_relevantes = precaución.
const AFECCION_LABELS_NOTA = {
  acne:'acné', rosácea:'rosácea', piel_sensible:'piel sensible',
  dermatitis:'dermatitis', piel_seca:'piel seca / deshidratada', manchas:'manchas',
  poros:'poros visibles', embarazo:'embarazo', lactancia:'lactancia',
};
function notaPersonalizadaPartes(data, clienta) {
  if (!clienta) return [];
  const afecciones = clienta.afecciones || [];
  const ciclo = clienta.ciclo || [];
  const L = a => AFECCION_LABELS_NOTA[a] || a;
  const partes = [];

  const utiles = (data.afecciones_utiles || []).filter(a => afecciones.includes(a));
  if (utiles.length) {
    const base = `Le viene bien a ${clienta.nombre} por: ${utiles.map(L).join(', ')}.`;
    // Criterio GAROA = mismas categorías que el veredicto «cosmética natural» de las herramientas
    const NO_GAROA = ['derivado_petroleo','silicona','petroquimico','fragrance_sintetica','no_cosmetica_natural','disruptor_endocrino','formaldehido_liberador'];
    const noGaroa = (data.categorias || []).some(c => NO_GAROA.includes(c));
    if (!noGaroa) partes.push({ tono:'verde', texto: base });
    else partes.push({ tono:'amarillo', texto: base + ' Pero no cumple el criterio GAROA.' });
  }

  if (ciclo.includes('embarazo') && data.lactancia === 'evitar')
    partes.push({ tono:'rojo', texto:'⚠ Contraindicado en embarazo.' });
  if (ciclo.includes('lactancia') && data.lactancia === 'evitar')
    partes.push({ tono:'rojo', texto:'⚠ Contraindicado en lactancia.' });
  if (ciclo.includes('embarazo') && data.lactancia === 'precaucion')
    partes.push({ tono:'rojo', texto:'Usar con precaución en embarazo.' });

  const relevantes = (data.afecciones_relevantes || []).filter(a => afecciones.includes(a));
  if (relevantes.length)
    partes.push({ tono:'rojo', texto:`Cuidado con ${clienta.nombre} por: ${relevantes.map(L).join(', ')}.` });

  if ((data.comedogenico || 0) >= 4 && afecciones.includes('acne'))
    partes.push({ tono:'rojo', texto:`Comedogenicidad alta ${data.comedogenico}/5 — precaución especial dado el historial de acné.` });
  else if ((data.comedogenico || 0) === 3 && afecciones.includes('acne'))
    partes.push({ tono:'rojo', texto:'Comedogenicidad media 3/5 — monitorizar en piel con tendencia al acné.' });

  return partes;
}

// Texto plano (compatibilidad): todas las partes juntas
function notaPersonalizada(data, clienta) {
  const p = notaPersonalizadaPartes(data, clienta);
  return p.length ? p.map(x => x.texto).join(' ') : null;
}

// Solo lo que pide cuidado (para el aviso «Revisar antes de recomendar»)
function notaCuidado(data, clienta) {
  const p = notaPersonalizadaPartes(data, clienta).filter(x => x.tono === 'rojo');
  return p.length ? p.map(x => x.texto).join(' ') : null;
}

// Etiquetas de color bajo cada ingrediente
const TONOS_NOTA = {
  verde:    'background:#D4EDDA;color:#155724',
  amarillo: 'background:#FFF3CD;color:#856404',
  rojo:     'background:#F8D7DA;color:#721C24',
};
function htmlNotaClienta(data, clienta) {
  const p = notaPersonalizadaPartes(data, clienta);
  if (!p.length) return '';
  return p.map(x => `<div style="margin-top:6px;padding:7px 12px;font-size:7.5pt;line-height:1.6;border-radius:2px;${TONOS_NOTA[x.tono]}">${x.texto}</div>`).join('');
}
