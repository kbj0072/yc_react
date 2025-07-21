function Body() {
  const objA = {
    a: 1,
    b: 2,
  };
  return (
    <div>
      <h1>Body</h1>
      <h2>a: {objA.a}</h2>
      <h2>b: {objA.b}</h2>
    </div>
  );
}

export default Body;
