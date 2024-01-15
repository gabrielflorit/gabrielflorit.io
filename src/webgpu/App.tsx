import { useEffect, useRef, useState } from 'react'
import { useInterval } from '@/utils/useSetInterval'
import './App.css'
import shaderCode from './shader.wgsl?raw'

const FPS = 10

async function draw(
  device: GPUDevice,
  context: GPUCanvasContext,
  pipeline: GPURenderPipeline,
  vertexBuffer: GPUBuffer,
  vertices: Float32Array,
  GRID_SIZE: number
) {
  // Create a uniform buffer that describes the grid.
  let uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE])
  let uniformBuffer = device.createBuffer({
    label: 'Grid Uniforms',
    size: uniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  device.queue.writeBuffer(uniformBuffer, 0, uniformArray)
  let bindGroup = device.createBindGroup({
    label: 'Cell renderer bind group',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
  })
  // Clear the canvas with a render pass
  let encoder = device.createCommandEncoder()

  let pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: 'clear',
        clearValue: { r: 0, g: 0, b: 0.4, a: 1.0 },
        storeOp: 'store',
      },
    ],
  })

  // Draw the square.
  pass.setPipeline(pipeline)
  pass.setVertexBuffer(0, vertexBuffer)
  pass.setBindGroup(0, bindGroup)
  pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE)

  pass.end()

  device.queue.submit([encoder.finish()])
}

function App() {
  let canvasRef = useRef<HTMLCanvasElement>(null)
  let deviceRef = useRef<GPUDevice>()
  let pipelineRef = useRef<GPURenderPipeline>()
  let contextRef = useRef<GPUCanvasContext>()
  let vertexBufferRef = useRef<GPUBuffer>()
  let verticesRef = useRef<Float32Array>()

  let [gridSize, setGridSize] = useState(4)

  useEffect(() => {
    async function setup() {
      let adapter = await navigator.gpu.requestAdapter()
      if (!adapter) return

      deviceRef.current = await adapter.requestDevice()

      if (!canvasRef.current) return

      // Canvas configuration
      let context = canvasRef.current.getContext('webgpu')
      if (!context) return
      contextRef.current = context

      let canvasFormat = navigator.gpu.getPreferredCanvasFormat()
      contextRef.current.configure({
        device: deviceRef.current,
        format: canvasFormat,
      })

      // Create a buffer with the vertices for a single cell.
      verticesRef.current = new Float32Array([
        -0.8, -0.8, 0.8, -0.8, 0.8, 0.8,

        -0.8, -0.8, 0.8, 0.8, -0.8, 0.8,
      ])
      vertexBufferRef.current = deviceRef.current.createBuffer({
        label: 'Cell vertices',
        size: verticesRef.current.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      })
      deviceRef.current.queue.writeBuffer(
        vertexBufferRef.current,
        0,
        verticesRef.current
      )

      let vertexBufferLayout: GPUVertexBufferLayout = {
        arrayStride: 8,
        attributes: [
          {
            format: 'float32x2',
            offset: 0,
            shaderLocation: 0, // Position. Matches @location(0) in the @vertex shader.
          },
        ],
      }

      // Create the shader that will render the cells.
      let shaderModule = deviceRef.current.createShaderModule({
        label: 'Cell shader',
        code: shaderCode,
      })

      // Create a pipeline that renders the cell.
      pipelineRef.current = deviceRef.current.createRenderPipeline({
        label: 'Cell pipeline',
        layout: 'auto',
        vertex: {
          module: shaderModule,
          entryPoint: 'vertexMain',
          buffers: [vertexBufferLayout],
        },
        fragment: {
          module: shaderModule,
          entryPoint: 'fragmentMain',
          targets: [
            {
              format: canvasFormat,
            },
          ],
        },
      })
    }

    setup()
  }, [])

  useInterval(() => {
    setGridSize(Math.min(gridSize + 1, 2 ** 9))
  }, 1000 / FPS)

  useEffect(() => {
    if (
      !deviceRef.current ||
      !contextRef.current ||
      !pipelineRef.current ||
      !vertexBufferRef.current ||
      !verticesRef.current
    )
      return
    draw(
      deviceRef.current,
      contextRef.current,
      pipelineRef.current,
      vertexBufferRef.current,
      verticesRef.current,
      gridSize
    )
  }, [gridSize])

  function clickHandler() {
    setGridSize(2)
  }

  return (
    <section>
      <p>Grid size: {gridSize}</p>
      <button
        className="border border-slate-700 rounded bg-slate-300 px-2"
        onClick={clickHandler}
      >
        Restart
      </button>
      <canvas ref={canvasRef} width={512} height={512} />
    </section>
  )
}

export default App
