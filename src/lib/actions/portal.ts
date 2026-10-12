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

export async function cambiarPassword(fd: FormData) {
  await accion("cambiarPassword", fd);
}

