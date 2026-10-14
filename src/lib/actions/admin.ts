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

export async function crearAccesoCliente(fd: FormData) {
  await accion("crearAccesoCliente", fd);
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
