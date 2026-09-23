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


// RESPONSABILIDAD 2  imprimir vales 
public class ImpresoraDeVales
{
    public void Imprimir(string estudiante, string tipoMenu, int cantidad, decimal total)
    {
        Console.WriteLine("----- VALE DE COMEDOR -----");
        Console.WriteLine($"{estudiante}: {cantidad} x menú {tipoMenu}");
        Console.WriteLine($"TOTAL: {total:0.00} Bs");
    }
}

// RESPONSABILIDAD 3  notificar por correo
public class NotificadorCorreo
{
    public void Avisar(string estudiante, string mensaje)
        => Console.WriteLine($"[CORREO] a {estudiante}: {mensaje}");
}
// RESPONSABILIDAD 4  persistir el pedid
public class RepositorioPedidos
{
    public void GuardarPedido(string estudiante, string tipoMenu, int cantidad, decimal total)
        => Console.WriteLine($"[BD] INSERT INTO pedidos VALUES ('{estudiante}', '{tipoMenu}', {cantidad}, {total})");
}


public class GestorDePedidos
{
    private readonly CalculadoraDePrecios _calculadora = new();
    private readonly RepositorioPedidos _repositorio = new();
    private readonly ImpresoraDeVales _impresora = new();
    private readonly NotificadorCorreo _notificador = new();

    public decimal ProcesarPedido(string estudiante, string tipoMenu, int cantidad)
    {
        decimal total = _calculadora.Total(tipoMenu, cantidad);

        _repositorio.GuardarPedido(estudiante, tipoMenu, cantidad, total);
        _impresora.Imprimir(estudiante, tipoMenu, cantidad, total);
        _notificador.Avisar(estudiante, $"Pedido registrado: {cantidad} x {tipoMenu}, {total:0.00} Bs");

        return total;
    }
}


public static class Demo
{
    public static void Correr()
    {
        Console.WriteLine("=== Comedor Sabor Andino ===\n");

        var gestor = new GestorDePedidos();
        gestor.ProcesarPedido("Noelia", "vegetariano", 2);   // 14 * 2 = 28.00 Bs

        Console.WriteLine();
        gestor.ProcesarPedido("Marco", "beca", 3);           // 5 * 3 = 15.00 Bs

        // Ahora, si cambia el formato del vale se toca SOLO ImpresoraDeVales;
        // si suben los precios, SOLO CalculadoraDePrecios;
        // si migran de motor de BD, SOLO RepositorioPedidos.
        // GestorDePedidos no se abre en ninguno de esos casos.
    }
}