import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $form = document.querySelector("#form-equipo");
const $selectCategoria = document.querySelector("#categoria_id");
const $btnGuardar = document.querySelector("#btn-guardar");

/**
 * TODO [F3] Formulario de registro de equipos.
 *
 * iniciarFormulario({ alGuardar }):
 *  1. Llene el <select id="categoria_id"> con listarCategorias()
 *     (cree cada <option> con createElement, value = id, texto = nombre).
 *  2. Al enviar el formulario (submit):
 *     - Evite el envío tradicional.
 *     - Limpie los errores anteriores: textContent de [data-error] y aria-invalid de los campos.
 *     - Construya el objeto con FormData. categoria_id y costo_interno deben ir como números.
 *     - Deshabilite #btn-guardar y cambie su texto a "Guardando…" mientras espera.
 *     - Llame a crearEquipo(datos).
 *     - Éxito: limpie el formulario, mostrarMensaje("exito", "Equipo <codigo> registrado.")
 *              y llame a alGuardar().
 *     - 422: por cada campo de error.datos.errors, escriba el PRIMER mensaje en
 *            el <p data-error="<campo>"> y marque el campo con aria-invalid="true".
 *     - Otro error: mostrarMensaje("error", ...).
 *     - Siempre (finally): rehabilite el botón y restaure su texto.
 */
export const iniciarFormulario = ({ alGuardar }) => {
  const cargarCategorias = async () => {
    try {
      const { data } = await listarCategorias();
      while ($selectCategoria.options.length > 1) {
        $selectCategoria.remove(1);
      }
      for (const categoria of data ?? []) {
        const $option = document.createElement("option");
        $option.value = categoria.id;
        $option.textContent = categoria.nombre;
        $selectCategoria.append($option);
      }
    } catch (error) {
      mostrarMensaje("error", error.message || "No se pudieron cargar las categorías.");
    }
  };

  cargarCategorias();

  $form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    $form.querySelectorAll("[data-error]").forEach(($p) => {
      $p.textContent = "";
    });
    $form.querySelectorAll("[aria-invalid]").forEach(($campo) => {
      $campo.removeAttribute("aria-invalid");
    });

    const formData = new FormData($form);
    const catRaw = formData.get("categoria_id");
    const costoRaw = formData.get("costo_interno");

    const datos = {
      codigo: formData.get("codigo")?.trim() ?? "",
      nombre: formData.get("nombre")?.trim() ?? "",
      categoria_id: catRaw === "" || catRaw === null ? null : Number(catRaw),
      fecha_adquisicion: formData.get("fecha_adquisicion") ?? "",
      costo_interno: costoRaw === "" || costoRaw === null ? null : Number(costoRaw),
    };

    const textoOriginal = $btnGuardar.textContent;
    $btnGuardar.disabled = true;
    $btnGuardar.textContent = "Guardando…";

    try {
      const respuesta = await crearEquipo(datos);
      const equipo = respuesta?.data ?? respuesta;

      $form.reset();
      mostrarMensaje("exito", `Equipo ${equipo?.codigo ?? datos.codigo} registrado.`);
      if (typeof alGuardar === "function") {
        alGuardar();
      }
    } catch (error) {
      if (error.status === 422 && error.datos?.errors) {
        for (const [campo, mensajes] of Object.entries(error.datos.errors)) {
          const $error = $form.querySelector(`[data-error="${campo}"]`);
          if ($error && Array.isArray(mensajes) && mensajes.length > 0) {
            $error.textContent = mensajes[0];
          }
          const $input = $form.querySelector(`[name="${campo}"]`);
          if ($input) {
            $input.setAttribute("aria-invalid", "true");
          }
        }
      } else {
        mostrarMensaje("error", error.message || "No se pudo registrar el equipo.");
      }
    } finally {
      $btnGuardar.disabled = false;
      $btnGuardar.textContent = textoOriginal;
    }
  });
};
