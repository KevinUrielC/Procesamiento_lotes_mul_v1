// Cronómetros
const GLOBAL_TIMER = new Timer(1000);
const PROCESS_TIMER = new Timer(1000);

document.addEventListener('DOMContentLoaded', function(){
    addEventListener();    
});
//Definimos las variables para los lotes (los que se cuentan y para los restantes)
// Lista de procesos
let lotes= [];

// Detener proceso en ejecución
let abortController;
let abortSignal;

let pause;
let numeroLote = 0;
let numeroProcesos = 0;

let loteActual;
let proceso;

//Función addEventListener (aquí el programa esta pendiente a capturar las teclas)
function addEventListener(){
    const botonIngresar =  document.querySelector('#ingresar');
    botonIngresar.addEventListener('click', ObtenerNumeroProcesos);  

    document.addEventListener('keydown', (e)=>{
        const alerta = document.querySelector('.alerta');
        switch(e.key){
            case 'e':
                console.log('error');
                if(!pause){
                    abortController.abort();
                    proceso.resultado = 'ERROR';
                    loteActual.shift();
                    ProcesosTerminados();
                }
                break;
            case 'i':
                    alerta.innerHTML = `PROCESO INTERRUPIDO`;
                    console.log('interrupcion');
                    if(!pause && loteActual.length > 1){
                        abortController.abort();
                        loteActual.push(loteActual.shift());
                        actualizarTabla();
                    }
                break;
            case 'p':
                    alerta.innerHTML = `PAUSE`;
                    console.log('Pause');
                    pause = true;
                    GLOBAL_TIMER.pause();
                    PROCESS_TIMER.pause();
                break;
            case 'c':
                    alerta.innerHTML = ` `;
                    console.log('Continua');
                    pause = false;
                    GLOBAL_TIMER.resume();
                    PROCESS_TIMER.resume();
                break;

        }
    });
}
//Función para obtener la cantidad de procesos
function ObtenerNumeroProcesos(){
    const procesos = Number(document.querySelector('#procesos').value);
    //Valida si es un numero mayor a 0
    if(procesos){
       ingresarProceso(procesos);
    }else{
        alert('Debe ser un numero mayor a 0');
    }   
}
//Generador de procesos (lista de nombres, numeros aleatorios y operación aleatoria)
function crearProcesos(id){
    const nombres = ['Kevin', 'Jordy', 'Nayeli', 'Chris', 'Marco'];
    const nombre = nombres[randomNumber(0, 5)];
    const tiempo = randomNumber(5, 16);
    const operacion = generarOperacion();
    
    const errores = validar(operacion);

    if(isEmpty(errores)){
        const proceso =  new Proceso(id, nombre, tiempo, operacion);
        proceso.RealizarOperacion();
        return proceso;
    }
    else{
        crearProcesos(id);
    }
}
//Función para capturar el proceso
function ingresarProceso(procesos){
    let lote = [];
    for(let i = 0; i<procesos; i++){
        const proceso = crearProcesos(i+1);
        lote.push(proceso);
    }
    dividirLotes(lote);
    run();
}
//Generamos la operación de manera aleatoria (Punto 2 de las indicaciones)
//Esto es mandado a llamar por el generador de procesos, pasa asignar un operador.
function generarOperacion(){
    let operacion;
    const operado1 = randomNumber();
    const operado2 = randomNumber();
    switch(randomNumber(1, 8)){
        case 1:
            operacion = '+'
            break;
        case 2:
            operacion = '-'
            break;
        case 3:
            operacion = '/'
            break;
        case 4:
            operacion = '*'
            break;
        case 5:
            operacion = '%'
            break;
        case 6:
            operacion = 'x'
            break;
        case 7:
            operacion = 's'
            break;
    }
    return `${operado1}${operacion}${operado2}`;
}

async function run(){
    abortController = new AbortController();
    GLOBAL_TIMER
        .action(t => {
            let m = Math.floor(t.currentCycle / 60);
            let s = Math.floor(t.currentCycle % 60);
            document.getElementById('tiempoTotal').innerHTML = `Tiempo Global: <span>${checkTime(m)} : ${checkTime(s)}</span> minutos`;
        })
        .start();
    await ejecutar();
    
    console.log('termine');

    GLOBAL_TIMER.destroy();
    PROCESS_TIMER.destroy();
}

async function ejecutar(){
    const tablaProceso = document.querySelector('#loteProceso');
    //Contador de lotes restantes
    while(lotes.length){
        loteActual = lotes.shift();
        document.getElementById('lotePendientes').innerHTML = `Lotes Pendientes: ${lotes.length}`;
        numeroLote++;
        // for(proceso of lote){
        while(loteActual.length){
            actualizarTabla();
            abortController = new AbortController();
            abortSignal = abortController.signal;
            proceso = loteActual[0];
            actualizarPoceso();
            try{
                await procesoEjecucion(abortSignal);
                ProcesosTerminados();
            }catch(err){
                console.warn(err);
                continue
            }finally{
                PROCESS_TIMER.reset();
                delete abortController;
            }
           loteActual.shift();
        }
        tablaProceso.innerHTML = ``;
    }
}

async function procesoEjecucion(signal){
    const tiempos = document.querySelectorAll('#tiempo');
    let i = 0;
    return new Promise((resolve, reject)=>{
        PROCESS_TIMER
            .action(t => {
                tiempos[0].innerHTML = `Tiempo Trascurrido: <span>${i} segundos</span>`;
                tiempos[1].innerHTML = `Tiempo Restante: <span>${proceso.tiempoEstimado - i-1} segundos </span>`; //time fixed
                ++i;
            })
            .repeat((proceso.tiempoEstimado - i))
            .done(resolve)
            .start();

        signal.addEventListener('abort', (error) => {
            PROCESS_TIMER.reset();
            PROCESS_TIMER.stop();
            reject(error);
        });
    });
}
//Actualiza la tabla de "Lote en Proceso" Este cambio se pidio desde el programa anterior
function actualizarTabla(){
    const tablaProceso = document.querySelector('#loteProceso');
    tablaProceso.innerHTML = ` `;
    for(const process of loteActual){
        const row = document.createElement('TR');
        row.innerHTML = ` 
            <td>${numeroLote}</td>
            <td>${process.id}</td>
            <td>${process.tiempoEstimado}</td>
        `;
        tablaProceso.appendChild(row);
    }
}
//Formato de procesos Finalizados
function ProcesosTerminados(){
    const alert = document.querySelector('.alerta');
    const tbody  = document.querySelector('#procesoTerminado');
    const row = document.createElement('TR');
    alert.innerHTML = ` `;
    row.innerHTML = `
        <td>${numeroLote}</td>
        <td>${proceso.id}</td>
        <td>${proceso.operacion}</td>
        <td>${proceso.resultado}</td>
    `;
    tbody.appendChild(row);
}
//Formato de proceso en ejecución
function actualizarPoceso(){
    const divProceso = document.querySelector('#procesoEjecucion');
     divProceso.innerHTML = `
        <p>ID: <span>${proceso.id}</span></p>
        <p>Nombre: <span>${proceso.nombre}</span></p>
        <p>Operacion: <span>${proceso.operacion}</span></p>
        <p>Tiempo Max. Estimado: <span>${proceso.tiempoEstimado}</span></p>
        <p id = "tiempo"></p>
        <p id = "tiempo"></p>
     `;
}
//Dividimos los lotes (1 lote por cada 5 procesos)
function dividirLotes(lote){
    for (let i = 0; i < lote.length; i+=5){
        const pedazo = lote.slice(i, i + 5);//4
        lotes.push(pedazo);
    }
}
//Ya no se utiliza una expresión regular
function IsValidDivision(operacion){ //PROBLEMAS PARA VALIDAR LA LETRA S SOLUCIONADO
    const operador = operacion.match('[+-/%\*xs]{1,1}') //Obtiene operacion +, -, *, 7, %
    if( operador[0] ==='/' || operador [0]==='%' || operador[0]==='s'){
        const operando = validarOperando(operacion, operador);
        if(operando === '0'){
           return false;
        }
    }
    return true
}
                       
//Obtiene los dos operandos y retorna el segundo para despues validar si es 0 
function validarOperando (operacion, operando){
    const operandos =  operacion.split(operando);
    return operandos[1];
}
//Validación del romato de división y reciduo (de momento no se usa)
function validar(operacion){
    let errores = []
    if(!IsValidDivision(operacion)) 
        errores.push('El formato de División o Residuo no es valido.');
    return errores;
}

function isEmpty(array){
    return array.length === 0;
}

function randomNumber(min = 0, max=100){
    return Math.floor(Math.random() * (max - min)) + min;
}

const checkTime = (int) => {
    if (int < 10) { int = '0' + int };
    return int;
}
