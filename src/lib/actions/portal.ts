"use server";
import { accion } from "../api";

export async function crearContacto(fd: FormData) {
  await accion("crearContacto", fd);
}

export async function actualizarContacto(fd: FormData) {
  await accion("actualizarContacto", fd);
}

export async function eliminarContacto(fd: FormData) {
  await accion("eliminarContacto", fd);
}

export async function actualizarPerfil(fd: FormData) {
  await accion("actualizarPerfil", fd);
}

export async function cambiarClave(fd: FormData) {
  await accion("cambiarClave", fd);
}

export async function pagarCuota(fd: FormData) {
  await accion("pagarCuota", fd);
}

export async function solicitarTramite(fd: FormData) {
  await accion("solicitarTramite", fd);
}

export async function solicitarBaja(fd: FormData) {
  await accion("solicitarBaja", fd);
}

export async function denunciarSiniestro(fd: FormData) {
  await accion("denunciarSiniestro", fd);
}

