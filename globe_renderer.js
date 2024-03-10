const markerSvg = `<svg viewBox="-4 0 36 36">
    <path fill="currentColor" d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z"></path>
    <circle fill="black" cx="14" cy="14" r="7"></circle>
  </svg>`;

let globe = Globe()
  .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-day.jpg')
  .arcColor('color')
  .width(700)
  .height(700)
  .pointOfView({lat: 6.9325, lng: 79.8476, altitude: 2.5}, [0])
  .backgroundColor('#00000000')
  .arcDashLength(() => Math.random())
  .arcStroke(1)
  .arcDashGap(() => Math.random())
  .arcDashAnimateTime(() => Math.random() * 4000 + 500)
(document.getElementById('globeViz'));

globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.9;

window.electronAPI.receive('geoConnections', (data) => {
    const arcsData = [...data.geoConnections.map(c => {return {
        ...c,
        startLat: 6.9325,
        startLng: 79.8476,
        color: [['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)], ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]]
      }; })];
    /*const gData = [...data.geoConnections.map(c => {return {
        lat: c.endLat,
        lng: c.endLng,
        size: 20,
        color: [['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)], ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]]
      }; })];*/
    globe = globe.arcsData(arcsData)
      //.htmlElementsData(gData)
      /*.htmlElement(d => {
        const el = document.createElement('div');
        el.innerHTML = markerSvg;
        el.style.color = d.color;
        el.style.width = `${d.size}px`;
  
        el.style['pointer-events'] = 'auto';
        el.style.cursor = 'pointer';
        el.onclick = () => console.info(d);
        return el;
      })*/
      .pointOfView({
        lat: data.longLat[0],
        lng: data.longLat[1],
        altitude: 2.5
      }, [1000]);
      document.getElementById('label').innerHTML = data.geoConnections.length > 0 ? `${data.geoConnections.length} connections` : 'No connections';
});