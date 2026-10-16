// =============================
// PRODUCTOS DE LA PROFORMA
// =============================

console.log("proforma.js cargado correctamente");

const productos = [];

// Texto seguro para las plantillas HTML de tabla y revisión.
function escaparHtml(valor) {
    return String(valor).replace(/[&<>"']/g, caracter => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[caracter]));
}

// Misma precisión y límite que los modelos de FastAPI (12 dígitos, 2 decimales).
function montoValido(texto, permiteCero = false) {
    const limpio = String(texto).trim();
    if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(limpio)) return false;
    const valor = Number(limpio);
    return Number.isFinite(valor) && valor < 10000000000 &&
        (permiteCero ? valor >= 0 : valor > 0);
}

function centavos(valor) {
    return Math.round(Number(valor) * 100);
}

// =============================
// REVISIÓN
// =============================

const botonRevisar =
    document.getElementById(
        "boton-revisar"
    );

const modalRevision =
    document.getElementById(
        "modal-revision"
    );

const contenidoRevision =
    document.getElementById(
        "contenido-revision"
    );

const botonCerrarRevision =
    document.getElementById(
        "cerrar-revision"
    );

const botonVolverRevision =
    document.getElementById(
        "boton-volver-revision"
    );

const botonGenerarPdf =
    document.getElementById(
        "boton-generar-pdf"
    );

// =============================
// ELEMENTOS DEL FORMULARIO
// =============================

const entradaReferencia =
    document.getElementById("referencia");

const entradaCantidad =
    document.getElementById("cantidad");

const entradaPrecio =
    document.getElementById("precio");

const botonAgregar =
    document.getElementById("boton-agregar");

const tablaProductos =
    document.getElementById("tabla-productos");

const textoCantidadTotal =
    document.getElementById("cantidad-total");

const textoSubtotalGeneral =
    document.getElementById("subtotal-general");
const entradaTransfer =
    document.getElementById(
        "transfer"
    );

// =============================
// ELEMENTOS DE COLORES
// =============================

const opcionesTieneColores =
    document.querySelectorAll(
        'input[name="tiene-colores"]'
    );

const configuracionColores =
    document.getElementById(
        "configuracion-colores"
    );

const entradaNumeroColores =
    document.getElementById(
        "numero-colores"
    );

const botonConfigurarColores =
    document.getElementById(
        "boton-configurar-colores"
    );

const camposColores =
    document.getElementById(
        "campos-colores"
    );


// =============================
// PRUEBA DE ELEMENTOS
// =============================

console.log(
    "Botón:",
    botonAgregar
);

console.log(
    "Tabla:",
    tablaProductos
);

// =============================
// MOSTRAR / OCULTAR COLORES
// =============================

function cambiarEstadoColores() {
    actualizarBiblioteca();

    const opcionSeleccionada =
        document.querySelector(
            'input[name="tiene-colores"]:checked'
        );


    if (
        !opcionSeleccionada ||
        opcionSeleccionada.value === "no"
    ) {

        configuracionColores.classList.add(
            "oculto"
        );

        camposColores.innerHTML = "";

        entradaNumeroColores.value = "";

        entradaCantidad.disabled = false;

        return;
    }


    configuracionColores.classList.remove(
        "oculto"
    );
}


// =============================
// CONFIGURAR COLORES
// =============================

function configurarColores() {

    const ficha = fichaReferencia();
    if (!ficha || !ficha.colores.length) {
        alert("Esta referencia no tiene colores disponibles para configurar.");
        return;
    }
    const numeroColores =
        Number(
            entradaNumeroColores.value
        );


    if (
        !Number.isInteger(numeroColores) ||
        numeroColores < 2 || numeroColores > ficha.colores.length
    ) {

        alert(
            `Indica entre 2 y ${ficha.colores.length} colores disponibles.`
        );

        entradaNumeroColores.focus();

        return;
    }


    let html = '<div class="campos-variantes">';
    for (let i = 0; i < numeroColores; i++) {
        html += `<div class="variante-color">
            <label for="codigo-color-${i}">Código del color ${i + 1}</label>
            <select id="codigo-color-${i}" class="codigo-color">
                ${opcionesColor(ficha.colores)}
            </select>
        </div>`;
    }

    html += `

        </div>


        <div class="grupo-formulario">

            <label>
                ¿Todos los colores tienen la misma cantidad?
            </label>


            <div class="opciones-horizontal">

                <label>

                    <input
                        type="radio"
                        name="cantidades-iguales"
                        value="si"
                        checked
                    >

                    Sí

                </label>


                <label>

                    <input
                        type="radio"
                        name="cantidades-iguales"
                        value="no"
                    >

                    No

                </label>

            </div>

        </div>


        <div
            id="cantidades-individuales"
            class="cantidades-individuales"
        >
        </div>
    `;


    camposColores.innerHTML = html;


    entradaCantidad.disabled = false;


    const opcionesCantidades =
        document.querySelectorAll(
            'input[name="cantidades-iguales"]'
        );


    opcionesCantidades.forEach(
        opcion => {

            opcion.addEventListener(
                "change",
                configurarCantidadesIndividuales
            );
        }
    );
}


// =============================
// CANTIDADES DIFERENTES
// =============================

function configurarCantidadesIndividuales() {

    const opcion =
        document.querySelector(
            'input[name="cantidades-iguales"]:checked'
        );


    const contenedor =
        document.getElementById(
            "cantidades-individuales"
        );


    if (!contenedor) {
        return;
    }


    if (
        !opcion ||
        opcion.value === "si"
    ) {

        contenedor.innerHTML = "";

        entradaCantidad.disabled = false;

        return;
    }


    entradaCantidad.disabled = true;

    entradaCantidad.value = "";


    const codigosColor =
        document.querySelectorAll(
            ".codigo-color"
        );


    let html = '<h3>Cantidades por color</h3>';

    codigosColor.forEach(
        (entradaColor, indice) => {

            let codigo =
                entradaColor.value
                    .trim()
                    .toUpperCase();


            if (!codigo) {

                codigo =
                    `Color ${indice + 1}`;
            }


            html += `

                <div class="variante-color">

                    <label>
                        Cantidad de ${escaparHtml(codigo)}
                    </label>

                    <input
                        type="number"
                        class="cantidad-variante"
                        min="1"
                    >

                </div>
            `;
        }
    );


    contenedor.innerHTML = html;
}

// =============================
// AGREGAR REFERENCIA
// =============================

function agregarReferencia() {

    const referencia =
        entradaReferencia.value
            .trim()
            .toUpperCase();


    const ficha = fichaReferencia();
    if (!ficha) {
        alert("Ingresa una referencia base existente en la biblioteca.");
        entradaReferencia.focus();
        return;
    }

    const precio =
        Number(
            entradaPrecio.value
        );


    // =============================
    // VALIDAR REFERENCIA
    // =============================

    if (!referencia) {

        alert(
            "Debe ingresar una referencia."
        );

        entradaReferencia.focus();

        return;
    }


    // =============================
    // VALIDAR PRECIO
    // =============================

    if (
        !montoValido(entradaPrecio.value)
    ) {

        alert(
            "El precio debe ser mayor que 0, menor que 10 mil millones y tener hasta dos decimales."
        );

        entradaPrecio.focus();

        return;
    }


    // =============================
    // DETERMINAR SI HAY COLORES
    // =============================

    const opcionColores =
        document.querySelector(
            'input[name="tiene-colores"]:checked'
        );


    const tieneColores =
        opcionColores &&
        opcionColores.value === "si";


    const referenciasNuevas = [];

    const cantidadesNuevas = [];


    // =============================
    // SIN COLORES
    // =============================

    if (!tieneColores) {

        const cantidad =
            Number(
                entradaCantidad.value
            );


        if (
            !Number.isInteger(cantidad) ||
            cantidad <= 0
        ) {

            alert(
                "La cantidad debe ser un número entero mayor que 0."
            );

            entradaCantidad.focus();

            return;
        }


        const color = ficha.colores.length ? document.getElementById("color-unico").value : "";
        if (ficha.colores.length && !ficha.colores.includes(color)) {
            alert("Elige el código del color de la referencia.");
            return;
        }
        referenciasNuevas.push(color ? `${referencia}(${color})` : referencia);

        cantidadesNuevas.push(
            cantidad
        );
    }


    // =============================
    // CON COLORES
    // =============================

    else {

        const entradasColores =
            document.querySelectorAll(
                ".codigo-color"
            );


        if (
            entradasColores.length === 0
        ) {

            alert(
                "Debe configurar los colores antes de agregar la referencia."
            );

            return;
        }


        // =============================
        // CREAR REFERENCIAS DE COLORES
        // =============================

        for (
            const entradaColor
            of entradasColores
        ) {

            const codigo =
                entradaColor.value
                    .trim()
                    .toUpperCase();


            if (!codigo || !ficha.colores.includes(codigo)) {

                alert(
                    "Debe ingresar el código de todos los colores."
                );

                entradaColor.focus();

                return;
            }


            referenciasNuevas.push(
                `${referencia}(${codigo})`
            );
        }


        // =============================
        // CANTIDADES
        // =============================

        const opcionCantidades =
            document.querySelector(
                'input[name="cantidades-iguales"]:checked'
            );


        if (
            !opcionCantidades ||
            opcionCantidades.value === "si"
        ) {

            const cantidad =
                Number(
                    entradaCantidad.value
                );


            if (
                !Number.isInteger(cantidad) ||
                cantidad <= 0
            ) {

                alert(
                    "La cantidad debe ser un número entero mayor que 0."
                );

                entradaCantidad.focus();

                return;
            }


            referenciasNuevas.forEach(
                () => {

                    cantidadesNuevas.push(
                        cantidad
                    );
                }
            );
        }


        else {

            const entradasCantidades =
                document.querySelectorAll(
                    ".cantidad-variante"
                );


            if (
                entradasCantidades.length !==
                referenciasNuevas.length
            ) {

                alert(
                    "Debe indicar la cantidad de cada color."
                );

                return;
            }


            for (
                const entrada
                of entradasCantidades
            ) {

                const cantidad =
                    Number(
                        entrada.value
                    );


                if (
                    !Number.isInteger(cantidad) ||
                    cantidad <= 0
                ) {

                    alert(
                        "Todas las cantidades deben ser enteros mayores que 0."
                    );

                    entrada.focus();

                    return;
                }


                cantidadesNuevas.push(
                    cantidad
                );
            }
        }
    }


    // =============================
    // EVITAR DUPLICADOS
    // =============================

    if (new Set(referenciasNuevas).size !== referenciasNuevas.length) {
        alert("No puede repetir un código de color dentro de la misma referencia.");
        return;
    }

    const referenciasExistentes =
        productos.map(
            producto =>
                producto.referencia
        );


    for (
        const referenciaNueva
        of referenciasNuevas
    ) {

        if (
            referenciasExistentes.includes(
                referenciaNueva
            )
        ) {

            alert(
                `La referencia ${referenciaNueva} ya fue agregada.`
            );

            return;
        }
    }


    // =============================
    // AGREGAR PRODUCTOS
    // =============================

    referenciasNuevas.forEach(
        (referenciaFinal, indice) => {

            const cantidadFinal =
                cantidadesNuevas[indice];


            const subtotal =
                (cantidadFinal * centavos(precio)) / 100;


            productos.push({

                referencia:
                    referenciaFinal,

                cantidad:
                    cantidadFinal,

                precio:
                    precio,

                subtotal:
                    subtotal
            });
        }
    );


    // =============================
    // ACTUALIZAR INTERFAZ
    // =============================

    actualizarTabla();

    actualizarTotales();

    limpiarFormulario();
}

// =============================
// ACTUALIZAR TABLA
// =============================

function actualizarTabla() {

    tablaProductos.innerHTML = "";


    if (productos.length === 0) {

        tablaProductos.innerHTML = `
            <tr class="tabla-vacia">

                <td colspan="6">
                    No hay referencias agregadas.
                </td>

            </tr>
        `;

        return;
    }


    productos.forEach(
        (producto, indice) => {

            const fila =
                document.createElement("tr");


            fila.innerHTML = `

                <td>
                    ${escaparHtml(referenciaBase(producto.referencia))}
                </td>

                <td>${imagenProducto(producto.referencia)}</td>
                <td>
                    ${producto.cantidad}
                </td>

                <td>
                    $${producto.precio.toFixed(2)}
                </td>

                <td>
                    $${producto.subtotal.toFixed(2)}
                </td>

<td class="acciones-tabla">

    <button
        type="button"
        class="boton-editar"
        data-indice="${indice}"
    >
        Editar
    </button>

    <button
        type="button"
        class="boton-eliminar"
        data-indice="${indice}"
    >
        Eliminar
    </button>

</td>
            `;


            tablaProductos.appendChild(
                fila
            );
        }
    );


    activarBotonesEditar();

    activarBotonesEliminar();
}


// =============================
// ACTIVAR BOTONES EDITAR
// =============================

function activarBotonesEditar() {

    const botonesEditar =
        document.querySelectorAll(
            ".boton-editar"
        );


    botonesEditar.forEach(
        boton => {

            boton.addEventListener(
                "click",
                function () {

                    const indice =
                        Number(
                            boton.dataset.indice
                        );


                    editarReferencia(
                        indice
                    );
                }
            );
        }
    );
}

// =============================
// EDITAR REFERENCIA
// =============================

function editarReferencia(indice) {

    const producto =
        productos[indice];


    if (!producto) {

        return;
    }


    const nuevaReferencia =
        prompt(
            "Referencia:",
            producto.referencia
        );


    if (nuevaReferencia === null) {

        return;
    }


    const referenciaLimpia =
        nuevaReferencia
            .trim()
            .toUpperCase();


    if (!referenciaLimpia) {

        alert(
            "La referencia no puede estar vacía."
        );

        return;
    }


    // =============================
    // EVITAR DUPLICADOS
    // =============================

    const referenciaExiste =
        productos.some(
            (otroProducto, otroIndice) =>

                otroIndice !== indice &&

                otroProducto.referencia ===
                    referenciaLimpia
        );


    if (referenciaExiste) {

        alert(
            `La referencia ${referenciaLimpia} ya existe.`
        );

        return;
    }


    // =============================
    // CANTIDAD
    // =============================

    const nuevaCantidadTexto =
        prompt(
            "Cantidad:",
            producto.cantidad
        );


    if (nuevaCantidadTexto === null) {

        return;
    }


    const nuevaCantidad =
        Number(
            nuevaCantidadTexto
        );


    if (
        !Number.isInteger(nuevaCantidad) ||
        nuevaCantidad <= 0
    ) {

        alert(
            "La cantidad debe ser un entero mayor que 0."
        );

        return;
    }


    // =============================
    // PRECIO
    // =============================

    const nuevoPrecioTexto =
        prompt(
            "Precio unitario:",
            producto.precio
        );


    if (nuevoPrecioTexto === null) {

        return;
    }


    const nuevoPrecio =
        Number(
            nuevoPrecioTexto
        );


    if (
        !montoValido(nuevoPrecioTexto)
    ) {

        alert(
            "El precio debe ser mayor que 0, menor que 10 mil millones y tener hasta dos decimales."
        );

        return;
    }


    // =============================
    // ACTUALIZAR PRODUCTO
    // =============================

    producto.referencia =
        referenciaLimpia;

    producto.cantidad =
        nuevaCantidad;

    producto.precio =
        nuevoPrecio;

    producto.subtotal =
        (nuevaCantidad * centavos(nuevoPrecio)) / 100;


    actualizarTabla();

    actualizarTotales();
}

function activarBotonesEliminar() {

    const botonesEliminar =
        document.querySelectorAll(
            ".boton-eliminar"
        );


    botonesEliminar.forEach(
        boton => {

            boton.addEventListener(
                "click",
                function () {

                    const indice =
                        Number(
                            boton.dataset.indice
                        );


                    eliminarReferencia(
                        indice
                    );
                }
            );
        }
    );
}


function eliminarReferencia(indice) {

    productos.splice(
        indice,
        1
    );


    actualizarTabla();

    actualizarTotales();
}
// =============================
// OBTENER TOTALES
// =============================

function obtenerTotales() {

    const cantidadTotal =
        productos.reduce(
            (total, producto) =>
                total + producto.cantidad,
            0
        );


    const subtotalGeneral =
        productos.reduce(
            (total, producto) =>
                total + producto.cantidad * centavos(producto.precio),
            0
        ) / 100;


    let transfer =
        Number(
            entradaTransfer.value
        );


    if (
        !montoValido(entradaTransfer.value, true)
    ) {

        transfer = 0;
    }


    const total =
        (centavos(subtotalGeneral) + centavos(transfer)) / 100;


    return {

        cantidadTotal,

        subtotalGeneral,

        transfer,

        total
    };
}
// =============================
// MOSTRAR REVISIÓN
// =============================

function mostrarRevision() {

    const cliente =
        document
            .getElementById("cliente")
            .value
            .trim();


    const pais =
        document
            .getElementById("pais")
            .value
            .trim();


    // =============================
    // VALIDACIONES
    // =============================

    if (!cliente) {

        alert(
            "Debe ingresar el nombre del cliente."
        );

        document
            .getElementById("cliente")
            .focus();

        return;
    }


    if (productos.length === 0) {

        alert(
            "Debe agregar al menos una referencia."
        );

        return;
    }


    let transfer =
        Number(
            entradaTransfer.value
        );


    if (
        !montoValido(entradaTransfer.value, true)
    ) {

        alert(
            "La transferencia debe ser cero o positiva, menor que 10 mil millones y tener hasta dos decimales."
        );

        entradaTransfer.focus();

        return;
    }


    // =============================
    // IDIOMA
    // =============================

    const idiomaSeleccionado =
        document.querySelector(
            'input[name="idioma"]:checked'
        );


    const idioma =
        idiomaSeleccionado
            ? idiomaSeleccionado.value
            : "es";


    const nombreIdioma =
        idioma === "en"
            ? "English"
            : "Español";


    // =============================
    // TOTALES
    // =============================

    const totales =
        obtenerTotales();


    // =============================
    // FILAS
    // =============================

    let filasProductos = "";


    productos.forEach(
        producto => {

            filasProductos += `

                <tr>

                    <td>
                        ${escaparHtml(referenciaBase(producto.referencia))}
                    </td>

                    <td>${imagenProducto(producto.referencia)}</td>
                    <td>
                        ${producto.cantidad}
                    </td>

                    <td>
                        $${producto.precio.toFixed(2)}
                    </td>

                    <td>
                        $${producto.subtotal.toFixed(2)}
                    </td>

                </tr>
            `;
        }
    );


    // =============================
    // CONTENIDO
    // =============================

    contenidoRevision.innerHTML = `
        <img src="/api/empresa/logo" class="logo-empresa" alt="Tangerine Unlimited">

        <div class="revision-datos">

            <p>
                <strong>Cliente:</strong>
                ${escaparHtml(cliente)}
            </p>

            <p>
                <strong>País:</strong>
                ${escaparHtml(pais || "-")}
            </p>

            <p>
                <strong>Idioma:</strong>
                ${nombreIdioma}
            </p>

        </div>


        <div class="tabla-contenedor">

            <table>

                <thead>

                    <tr>
                        <th>Referencia</th><th>Imagen</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                    </tr>

                </thead>

                <tbody>

                    ${filasProductos}

                </tbody>

            </table>

        </div>


        <div class="revision-totales">

            <p>
                Cantidad total:
                <strong>
                    ${totales.cantidadTotal}
                </strong>
            </p>

            <p>
                Subtotal:
                <strong>
                    $${totales.subtotalGeneral.toFixed(2)}
                </strong>
            </p>

            <p>
                Transfer:
                <strong>
                    $${totales.transfer.toFixed(2)}
                </strong>
            </p>

            <p class="revision-total-final">
                Total:
                <strong>
                    $${totales.total.toFixed(2)}
                </strong>
            </p>

        </div>
    `;


    modalRevision.classList.remove(
        "oculto"
    );
}

// =============================
// CERRAR REVISIÓN
// =============================

function cerrarRevision() {

    modalRevision.classList.add(
        "oculto"
    );
}


// =============================
// ACTUALIZAR TOTALES
// =============================

function actualizarTotales() {

    const cantidadTotal =
        productos.reduce(
            (total, producto) =>
                total + producto.cantidad,
            0
        );


    const subtotalGeneral =
        productos.reduce(
            (total, producto) =>
                total + producto.cantidad * centavos(producto.precio),
            0
        ) / 100;


    textoCantidadTotal.textContent =
        cantidadTotal;


    textoSubtotalGeneral.textContent =
        `$${subtotalGeneral.toFixed(2)}`;
}


// =============================
// LIMPIAR FORMULARIO
// =============================

function limpiarFormulario() {

    entradaReferencia.value = "";

    entradaCantidad.disabled = false;

    entradaCantidad.value = "";

    entradaPrecio.value = "";


    // Volver a "Sin colores"

    const opcionNoColores =
        document.querySelector(
            'input[name="tiene-colores"][value="no"]'
        );


    if (opcionNoColores) {

        opcionNoColores.checked = true;
    }


    configuracionColores.classList.add(
        "oculto"
    );


    camposColores.innerHTML = "";

    entradaNumeroColores.value = "";


    actualizarBiblioteca();
    entradaReferencia.focus();
}


// =============================
// EVENTOS
// =============================

botonAgregar.addEventListener(
    "click",
    agregarReferencia
);

// =============================
// EVENTOS DE COLORES
// =============================

opcionesTieneColores.forEach(
    opcion => {

        opcion.addEventListener(
            "change",
            cambiarEstadoColores
        );
    }
);


botonConfigurarColores.addEventListener(
    "click",
    configurarColores
);
// =============================
// EVENTOS DE REVISIÓN
// =============================

botonRevisar.addEventListener(
    "click",
    mostrarRevision
);


botonCerrarRevision.addEventListener(
    "click",
    cerrarRevision
);


botonVolverRevision.addEventListener(
    "click",
    cerrarRevision
);

// =============================
// ENVIAR PROFORMA Y DESCARGAR PDF
// =============================

async function generarPdf() {
    if (botonGenerarPdf.disabled) return;
    const cliente = document.getElementById("cliente").value.trim();
    const transfer = Number(entradaTransfer.value);
    if (!cliente || !productos.length || !montoValido(entradaTransfer.value, true)) {
        alert("Revise el cliente, los productos y el monto de transferencia.");
        return;
    }
    const datos = {
        cliente,
        pais: document.getElementById("pais").value.trim(),
        idioma: document.querySelector('input[name="idioma"]:checked')?.value || "es",
        transfer,
        productos: productos.map(({referencia, cantidad, precio}) => ({referencia, cantidad, precio}))
    };
    const textoAnterior = botonGenerarPdf.textContent;
    botonGenerarPdf.disabled = true;
    botonGenerarPdf.textContent = "Generando PDF…";
    let url;
    try {
const respuesta = await fetch(
    "/generar-proforma",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    }
);
        if (!respuesta.ok) {
            let mensaje = "No se pudo generar el PDF. Intente nuevamente.";
            if (respuesta.status === 422) mensaje = "Revise los datos: cantidades enteras, precios positivos y montos con hasta dos decimales.";
            throw new Error(mensaje);
        }
        if (!respuesta.headers.get("content-type")?.includes("application/pdf")) {
            throw new Error("El servidor no devolvió un PDF válido.");
        }
// =============================
// OBTENER NOMBRE DEL PDF
// =============================

const disposicion =
    respuesta.headers.get(
        "content-disposition"
    ) || "";


let nombreArchivo =
    "Proforma.pdf";


// Nombre codificado en UTF-8.
// Ejemplo:
// filename*=utf-8''Proforma.Cliente.Panam%C3%A1.pdf

const coincidenciaUtf8 =
    disposicion.match(
        /filename\*=utf-8''([^;]+)/i
    );


if (coincidenciaUtf8) {

    nombreArchivo =
        decodeURIComponent(
            coincidenciaUtf8[1]
        );
}


// Nombre normal.
// Ejemplo:
// filename="Proforma.CLIENTE.USA.pdf"

else {

    const coincidenciaNormal =
        disposicion.match(
            /filename="?([^";]+)"?/i
        );


    if (coincidenciaNormal) {

        nombreArchivo =
            coincidenciaNormal[1]
                .trim();
    }
}


// =============================
// DESCARGAR PDF
// =============================

const archivo =
    await respuesta.blob();


url =
    URL.createObjectURL(
        archivo
    );


const enlace =
    document.createElement(
        "a"
    );


enlace.href =
    url;


enlace.download =
    nombreArchivo;


document.body.appendChild(
    enlace
);


enlace.click();


enlace.remove();
    } catch (error) {
        alert(error.message || "No se pudo conectar con el servidor.");
    } finally {
        if (url) setTimeout(() => URL.revokeObjectURL(url), 60000);
        botonGenerarPdf.disabled = false;
        botonGenerarPdf.textContent = textoAnterior;
    }
}

botonGenerarPdf.addEventListener("click", generarPdf);


// Biblioteca: la referencia conserva su base; cada fila identifica su color.
let bibliotecaReferencias = null;
const nombresColor = {
    AM: "amarillo", AZ: "azul", BA: "blanco con azul",
    BB: "beige y blanco", BE: "beige", BL: "blanco", BN: "beige y navy",
    BR: "blanco y rosado", BW: "negro/blanco", CH: "chocolate / marrón",
    DO: "dorado / gold", FU: "fucsia", GR: "gris", KA: "kaki",
    NA: "navy", NE: "negro", OL: "oliva", PL: "plateado",
    RO: "rojo", RW: "rojo/blanco", VE: "verde"
};
function fichaReferencia() {
    return bibliotecaReferencias?.[entradaReferencia.value.trim().toUpperCase()] || null;
}
function opcionesColor(colores) {
    return '<option value="">Elige un código</option>' + colores.map(c =>
        `<option value="${escaparHtml(c)}">${escaparHtml(c)}${nombresColor[c] ? ' — ' + nombresColor[c] : ''}</option>`).join('');
}
function actualizarBiblioteca() {
    const ficha = fichaReferencia();
    const estado = document.getElementById("estado-biblioteca");
    const selector = document.getElementById("color-unico");
    const anterior = selector.value;
    selector.innerHTML = opcionesColor(ficha?.colores || []);
    if (ficha?.colores.includes(anterior)) selector.value = anterior;
    if (ficha?.colores.length === 1) selector.value = ficha.colores[0];
    const adicionales = document.querySelector('input[name="tiene-colores"]:checked')?.value === 'si';
    document.getElementById("color-unico-contenedor").classList.toggle("oculto", !ficha?.colores.length || adicionales);
    opcionesTieneColores.forEach(opcion => { opcion.disabled = !ficha || ficha.colores.length < 2; });
    entradaNumeroColores.max = ficha?.colores.length || 0;
    if (ficha && ficha.colores.length < 2) {
        document.querySelector('input[name="tiene-colores"][value="no"]').checked = true;
        configuracionColores.classList.add("oculto");
        camposColores.innerHTML = '';
        entradaCantidad.disabled = false;
    }
    estado.textContent = !bibliotecaReferencias ? 'Biblioteca no disponible. Recarga la página.' :
        !entradaReferencia.value.trim() ? 'Ingresa la referencia base para ver sus colores.' :
        !ficha ? 'Referencia no encontrada en la biblioteca.' :
        ficha.colores.length ? `Colores disponibles: ${ficha.colores.map(c => nombresColor[c] ? `${c} = ${nombresColor[c]}` : c).join(', ')}` :
        'Esta referencia no tiene código de color: ingresa cantidad y precio.';
}
entradaReferencia.addEventListener('input', () => {
    camposColores.innerHTML = '';
    entradaCantidad.disabled = false;
    document.getElementById('color-unico').value = '';
    actualizarBiblioteca();
});
async function cargarBiblioteca() {
    try {
        const respuesta = await fetch('/api/referencias');
        if (!respuesta.ok) throw new Error('No se pudo leer la biblioteca');
        const datos = await respuesta.json();
        bibliotecaReferencias = datos.referencias;
        actualizarBiblioteca();
    } catch (error) {
        document.getElementById('estado-biblioteca').textContent = 'No se pudo cargar la biblioteca. Recarga la página o revisa imgreferencias.';
    }
}
cargarBiblioteca();


function referenciaBase(referencia) {
    return referencia.replace(/\([A-Z]{2,3}\)$/, '');
}
function imagenProducto(referencia) {
    const url = '/api/referencias/imagen?referencia=' + encodeURIComponent(referencia);
    return `<img src="${escaparHtml(url)}" alt="${escaparHtml(referencia)}"
        class="imagen-producto" loading="lazy"><span class="imagen-faltante" hidden>Imagen no disponible</span>`;
}
document.addEventListener('error', evento => {
    const imagen = evento.target;
    if (imagen?.classList?.contains('imagen-producto')) {
        imagen.hidden = true;
        imagen.nextElementSibling.hidden = false;
    }
}, true);
