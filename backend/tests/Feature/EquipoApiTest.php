<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

/*
| TODO [B6] Escriba las tres pruebas. Cada una debe verificar el código
| de estado Y algo más (estructura, encabezado, mensaje o estado de la base).
|
| Quite el ->todo() de cada prueba al implementarla.
| Ejecute:  php artisan test --filter=EquipoApi
*/

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    $categoria = Categoria::factory()->create();

    $response = $this->postJson('/api/equipos', [
        'codigo'            => 'EQ-1234',
        'nombre'            => 'Laptop Dell Latitude 5440',
        'categoria_id'      => $categoria->id,
        'fecha_adquisicion' => '2026-09-15',
        'costo_interno'     => 450000,
    ]);

    $response->assertCreated()
        ->assertHeader('Location')
        ->assertJsonStructure([
            'data' => ['id', 'codigo', 'nombre', 'estado', 'fecha_adquisicion', 'categoria' => ['id', 'nombre']],
        ]);

    $this->assertDatabaseHas('equipos', [
        'codigo' => 'EQ-1234',
        'nombre' => 'Laptop Dell Latitude 5440',
    ]);
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {
    $this->postJson('/api/equipos', [
        'codigo'            => 'INVALIDO',
        'nombre'            => 'AB',
        'categoria_id'      => 99999,
        'fecha_adquisicion' => '2099-12-31',
        'costo_interno'     => -50,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'codigo',
            'nombre',
            'categoria_id',
            'fecha_adquisicion',
            'costo_interno',
        ]);
});

it('impide eliminar un equipo prestado y responde 409', function () {
    $equipo = Equipo::factory()->prestado()->create();

    $this->deleteJson("/api/equipos/{$equipo->id}")
        ->assertStatus(409)
        ->assertExactJson([
            'mensaje' => 'No se puede eliminar un equipo prestado.',
            'codigo'  => 'REGLA_NEGOCIO',
        ]);

    $this->assertDatabaseHas('equipos', ['id' => $equipo->id]);
});
