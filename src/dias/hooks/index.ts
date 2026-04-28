export const usarFechas = () => {
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  const maniana = new Date(hoy);
  maniana.setDate(hoy.getDate() + 1);

  return {
    fechas: () => ({ hoy, ayer, maniana }),
  };
};
