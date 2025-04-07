import React from "react"

interface AirQuality {
  pm25: number
  updatedAt: string
}

export const revalidate = 30 // 30 seconds

export default async function Page() {
  const response = await fetch("http://api.waqi.info/feed/A421915/?token=06605c96a372586b4da18f3e888e48e74ec192b1")
  const data = await response.json()

  const airQuality: AirQuality = {
    pm25: data.data.iaqi.pm25.v,
    updatedAt: data.data.time.s
  }

  return (
    <main>
      <h1>Air Quality Data</h1>
      <p>PM2.5: {airQuality.pm25}</p>
      <p>Updated At: {airQuality.updatedAt}</p>
    </main>
  )
}