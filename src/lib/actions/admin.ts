"use server";
import { accion } from "../api";

/** Cada acción se ejecuta en el backend (Railway); acá solo se reenvía el formulario. */
export async function crearCliente(fd: FormData) {
  await accion("crearCliente", fd);
}

export async function actualizarCliente(fd: FormData) {
  await accion("actualizarCliente", fd);
}

export async function alternarCliente(fd: FormData) {
  await accion("alternarCliente", fd);
}

export async function quitarPinCliente(fd: FormData) {
  await accion("quitarPinCliente", fd);
}

export async function restablecerPassword(fd: FormData) {
  await accion("restablecerPassword", fd);
}

export async function alternarUsuario(fd: FormData) {
  await accion("alternarUsuario", fd);
}

export async function crearAdmin(fd: FormData) {
  await accion("crearAdmin", fd);
}

export async function crearContactoAdmin(fd: FormData) {
  await accion("crearContactoAdmin", fd);
}

export async function eliminarContactoAdmin(fd: FormData) {
  await accion("eliminarContactoAdmin", fd);
}

export async function crearPoliza(fd: FormData) {
  await accion("crearPoliza", fd);
}

export async function actualizarPoliza(fd: FormData) {
  await accion("actualizarPoliza", fd);
}

export async function agregarCuota(fd: FormData) {
  await accion("agregarCuota", fd);
}

export async function actualizarCuota(fd: FormData) {
  await accion("actualizarCuota", fd);
}

export async function anularCuota(fd: FormData) {
  await accion("anularCuota", fd);
}

export async function subirDocumento(fd: FormData) {
  await accion("subirDocumento", fd);
}

export async function eliminarDocumento(fd: FormData) {
  await accion("eliminarDocumento", fd);
}

export async function registrarPago(fd: FormData) {
  await accion("registrarPago", fd);
}

export async function anularPago(fd: FormData) {
  await accion("anularPago", fd);
}

export async function subirArchivoPago(fd: FormData) {
  await accion("subirArchivoPago", fd);
}

export async function rechazarAviso(fd: FormData) {
  await accion("rechazarAviso", fd);
}

export async function eliminarCliente(fd: FormData) {
  await accion("eliminarCliente", fd);
}

export async function aprobarAviso(fd: FormData) {
  await accion("aprobarAviso", fd);
}

export async function resolverAlerta(fd: FormData) {
  await accion("resolverAlerta", fd);
}

export async function anularPolizaDesdeAlerta(fd: FormData) {
  await accion("anularPolizaDesdeAlerta", fd);
}

export async function aplicarTramite(fd: FormData) {
  await accion("aplicarTramite", fd);
}

export async function guardarConfig(fd: FormData) {
  await accion("guardarConfig", fd);
}

export async function crearSiniestro(fd: FormData) {
  await accion("crearSiniestro", fd);
}

export async function actualizarSiniestro(fd: FormData) {
  await accion("actualizarSiniestro", fd);
}

export async function agregarNotaSiniestro(fd: FormData) {
  await accion("agregarNotaSiniestro", fd);
}

export async function subirArchivoSiniestro(fd: FormData) {
  await accion("subirArchivoSiniestro", fd);
}

export async function eliminarSiniestro(fd: FormData) {
  await accion("eliminarSiniestro", fd);
}

