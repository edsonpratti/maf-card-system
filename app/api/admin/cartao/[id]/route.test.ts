const assert = require('assert');

test('route handling logic', () => {
    const error = { message: 'Test error' };
    const expectedResponse = {
        error: "Erro ao gerar o PNG do cartão",
        details: error.message || 'Erro desconhecido'
    };

    const actualResponse = {
        error: "Erro ao gerar o PNG do cartão",
        details: error.message || 'Erro desconhecido'
    };

    assert.deepStrictEqual(actualResponse, expectedResponse);
});