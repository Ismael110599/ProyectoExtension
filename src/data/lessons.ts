export const localLessons: Record<string, string[]> = {
  principiante: [
    `¡Hola! Veo que estás empezando a aprender programación en Python. Vamos a construir las bases poco a poco.

1. **Variables:** Imagina que una variable es una caja donde guardas un dato.

   edad = 10
   nombre = "Ana"

2. **Operaciones básicas:** Puedes hacer cuentas con números.

   a = 2
   b = 3
   suma = a + b  # suma vale 5

*Ejercicio:* Crea una variable con tu edad y otra con tu año de nacimiento. Calcula cuántos años tendrás dentro de 5 años.
`,
    `Excelente. Ahora veamos las **condicionales**.

La estructura básica es:

   edad = 18
   if edad >= 18:
       print("Eres mayor de edad")
   else:
       print("Eres menor")

*Ejercicio:* Escribe un programa que pregunte por un número y diga si es positivo, negativo o cero.`
  ],
  intermedio: [
    `¡Perfecto! Ya tienes una base en Python, así que daremos un paso más para profundizar.

1. **Programación orientada a objetos (POO):**

   class Persona:
       def __init__(self, nombre, edad):
           self.nombre = nombre
           self.edad = edad
       
       def saludar(self):
           return f"Hola, soy {self.nombre} y tengo {self.edad} años"

   persona = Persona("Luis", 25)
   print(persona.saludar())

*Ejercicio:* Crea una clase 'Círculo' con un método que calcule el área.
`,
    `Sigamos con **funciones de orden superior** y estructuras de datos.

   def filtrar_pares(numeros):
       return list(filter(lambda x: x % 2 == 0, numeros))

   lista = [1, 2, 3, 4, 5, 6]
   print(filtrar_pares(lista))  # [2, 4, 6]

*Ejercicio:* Escribe una función que reciba otra función y una lista, y aplique la función a cada elemento.`
  ]
};
