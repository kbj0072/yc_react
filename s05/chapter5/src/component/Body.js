function Body() {
  const boolA = true;
  const boolB = false;
  return (
    <div>
      <h1>Body</h1>
      <h2>{String(boolA || boolB)}</h2>
    </div>
  );
}

export default Body;
