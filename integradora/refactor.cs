// Solucion: Roberto Angel Ayala Lecoña

// Violacion curada: SRP 

using System;

namespace Integradora.Comedor.Refactor;

// RESPONSABILIDAD 1  calcular el precio 
public class CalculadoraDePrecios
{
    public decimal PrecioUnitario(string tipoMenu) => tipoMenu switch
    {
        "estandar"    => 12m,
        "vegetariano" => 14m,
        "beca"        => 5m,
        _             => 12m
    };

    public decimal Total(string tipoMenu, int cantidad)
        => PrecioUnitario(tipoMenu) * cantidad;
}

public class ImpresoraDeVales
{
    public void Imprimir(string estudiante, string tipoMenu, int cantidad, decimal total)
    {
        Console.WriteLine("----- VALE DE COMEDOR -----");
        Console.WriteLine($"{estudiante}: {cantidad} x menú {tipoMenu}");
        Console.WriteLine($"TOTAL: {total:0.00} Bs");
    }
}


public class NotificadorCorreo
{
    public void Avisar(string estudiante, string mensaje)
        => Console.WriteLine($"[CORREO] a {estudiante}: {mensaje}");
}