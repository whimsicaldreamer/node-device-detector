export interface ResultInfoResolution {
  width: string;
  height: string;
}

export interface ResultInfoDisplay {
  size: string;
  resolution: string|ResultInfoResolution;
  ratio: string;
  ppi: string;
}

export interface ResultInfoHardwareCPU {
  name: string;
  cores: number;
  clock_rate: number;
  process?: number;
  gpu_id?: number;
}

export interface ResultInfoHardwareGPU {
  name: string;
  clock_rate: number;
}

export interface ResultInfoHardware {
  ram: number;
  cpu_id: number;
  gpu_id: number;
  cpu: ResultInfoHardwareCPU;
  gpu: ResultInfoHardwareGPU;
}

export interface ResultInfoPerformance {
  antutu: number;
}

export interface ResultInfoSize {
  width: string;
  height: string;
  thickness: string;
}

export interface ResultInfoDevice {
  display?: ResultInfoDisplay;
  sim?: number;
  size?: string|ResultInfoSize;
  weight?: string;
  release?: string;
  os?: string;
  hardware?: ResultInfoHardware;
  performance?: ResultInfoPerformance;
}
