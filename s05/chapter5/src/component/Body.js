function Body() {
  const num = 19;
  return (
    <>
      <h2>
        {num}은(는) {num % 2 === 0 ? "짝수" : "홀수"}입니다.
      </h2>
    </>
  );
}

export default Body;
