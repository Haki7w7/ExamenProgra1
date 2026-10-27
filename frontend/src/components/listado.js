import { listarEquipos, eliminarEquipo } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const POR_PAGINA = 6;

const $lista = document.querySelector("#lista-equipos");
const $plantilla = document.querySelector("#tpl-equipo");
const $resumen = document.querySelector("#resumen");
const $paginaActual = document.querySelector("#pagina-actual");
const $btnAnterior = document.querySelector("#btn-anterior");
const $btnSiguiente = document.querySelector("#btn-siguiente");

let paginaActual = 1;
let ultimaPagina = 1;

// YA IMPLEMENTADO — "2026-09-15" -> "15 set 2026"
export const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

/**
 * TODO [F2] Listado y paginación.
 *
 * cargarPagina(pagina):
 *  - Marque la lista como ocupada (aria-busy="true") mientras carga y desmárquela al terminar.
 *  - Obtenga la página con listarEquipos(pagina, POR_PAGINA).
 *  - Vacíe la lista y, por cada equipo, clone #tpl-equipo y llene:
 *      .codigo, .nombre, .categoria (nombre de la categoría), .fecha (con formatearFecha)
 *      .estado  -> texto del estado y atributo data-estado="<estado>" (el CSS le da color)
 *      li       -> atributo data-id="<id>"
 *    Use SIEMPRE textContent con los datos de la API (nunca innerHTML).
 *  - Si no hay equipos, muestre un <li class="vacio"> con "No hay equipos registrados."
 *  - #resumen:      "Mostrando <from>–<to> de <total>"
 *  - #pagina-actual: "Página <current_page> de <last_page>"
 *  - Deshabilite #btn-anterior en la primera página y #btn-siguiente en la última.
 *  - Si falla, muestre el error con mostrarMensaje("error", ...).
 */
export const cargarPagina = async (pagina = 1) => {
  $lista.setAttribute("aria-busy", "true");

  try {
    const { data, meta } = await listarEquipos(pagina, POR_PAGINA);

    paginaActual = meta.current_page;
    ultimaPagina = meta.last_page;

    $lista.replaceChildren();

    if (data.length === 0) {
      const $vacio = document.createElement("li");
      $vacio.className = "vacio";
      $vacio.textContent = "No hay equipos registrados.";
      $lista.append($vacio);
    } else {
      for (const equipo of data) {
        const $fragmento = $plantilla.content.cloneNode(true);
        const $tarjeta = $fragmento.querySelector("li");
        const $estado = $fragmento.querySelector(".estado");

        $tarjeta.dataset.id = equipo.id;
        $fragmento.querySelector(".codigo").textContent = equipo.codigo;
        $fragmento.querySelector(".nombre").textContent = equipo.nombre;
        $fragmento.querySelector(".categoria").textContent = equipo.categoria?.nombre ?? "";
        $fragmento.querySelector(".fecha").textContent = formatearFecha(equipo.fecha_adquisicion);

        $estado.textContent = equipo.estado;
        $estado.dataset.estado = equipo.estado;

        $lista.append($fragmento);
      }
    }

    $resumen.textContent = `Mostrando ${meta.from ?? 0}–${meta.to ?? 0} de ${meta.total}`;
    $paginaActual.textContent = `Página ${meta.current_page} de ${meta.last_page}`;

    $btnAnterior.disabled = meta.current_page <= 1;
    $btnSiguiente.disabled = meta.current_page >= meta.last_page;
  } catch (error) {
    mostrarMensaje("error", error.message || "No se pudo cargar el inventario de equipos.");
  } finally {
    $lista.removeAttribute("aria-busy");
  }
};

/**
 * TODO [F4] Eliminación con manejo de reglas de negocio.
 *
 * Use DELEGACIÓN DE EVENTOS: un solo listener en $lista que detecte clics en .btn-eliminar.
 *  - Pida confirmación con confirm().
 *  - Llame a eliminarEquipo(id).
 *  - 204: muestre "Equipo eliminado." y recargue la página actual
 *         (si era el último de la página y no es la primera, vaya a la anterior).
 *  - 409: muestre el mensaje que envía la API (error.datos.mensaje).
 *  - Otro error: muestre un mensaje general.
 */
const alHacerClicEnLista = async (evento) => {
  const $btnEliminar = evento.target.closest(".btn-eliminar");
  if (!$btnEliminar) return;

  const $tarjeta = $btnEliminar.closest("li[data-id]");
  const id = $tarjeta?.dataset.id;
  if (!id) return;

  if (!confirm("¿Desea eliminar este equipo?")) return;

  const cantidadEnPagina = $lista.querySelectorAll("li[data-id]").length;

  try {
    await eliminarEquipo(id);
    mostrarMensaje("exito", "Equipo eliminado.");

    const paginaDestino = cantidadEnPagina <= 1 && paginaActual > 1 ? paginaActual - 1 : paginaActual;
    await cargarPagina(paginaDestino);
  } catch (error) {
    if (error.status === 409) {
      mostrarMensaje("error", error.datos?.mensaje ?? error.message);
    } else {
      mostrarMensaje("error", "No se pudo eliminar el equipo.");
    }
  }
};

// Parcialmente implementado: complete el TODO de los botones de paginación.
export const iniciarListado = () => {
  $lista.addEventListener("click", alHacerClicEnLista);

  // TODO [F2] Conecte #btn-anterior y #btn-siguiente con cargarPagina()
  $btnAnterior.addEventListener("click", () => {
    if (paginaActual > 1) {
      cargarPagina(paginaActual - 1);
    }
  });

  $btnSiguiente.addEventListener("click", () => {
    if (paginaActual < ultimaPagina) {
      cargarPagina(paginaActual + 1);
    }
  });

  cargarPagina(1);
};
