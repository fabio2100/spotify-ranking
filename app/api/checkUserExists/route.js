import pool from "../../../db"
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Función para verificar si el usuario existe en la base de datos
async function checkUserExists(user_name) {
  const query = "SELECT user_name FROM user_data_spotify WHERE user_name = $1";
  const values = [user_name];
  const result = await pool.query(query, values);
  return result.rows.length > 0;
}

export async function GET(req) {
  const cookieStore = await cookies();
  const user_name = cookieStore.get("user_name").value;

  if (!user_name) {
    redirect("/");
  }

  const userExists = await checkUserExists(user_name);

  if (!userExists) {
    // Eliminar las cookies
    cookieStore.delete("user_name");
    cookieStore.delete("spotify_refresh_token");
    cookieStore.delete("spotify_access_token");

    redirect("/");
  }

  return new NextResponse(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
