import React from 'react';
import { Row, Col, Alert, Button } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import useAuth from '../../../hooks/useAuth';
import useScriptRef from '../../../hooks/useScriptRef';

// Mensagem certa para cada falha (QA-021): antes tudo aparecia como "senha incorreta",
// inclusive limite de tentativas (429) e servidor fora do ar.
const loginErrorMessage = (err) => {
  const response = err && err.response;
  if (!response) {
    return 'Não foi possível conectar ao sistema. Verifique a internet e tente novamente.';
  }
  const apiMessage = response.data && typeof response.data.message === 'string' ? response.data.message : '';
  if (response.status === 401) return 'Usuário ou senha incorretos.';
  if (response.status === 429) {
    return /^Muitas tentativas/.test(apiMessage) ? apiMessage : 'Muitas tentativas de login. Aguarde um minuto e tente de novo.';
  }
  if (response.status >= 500) return 'O sistema está indisponível no momento. Tente novamente em instantes.';
  return 'Não foi possível entrar. Confira o CPF e a senha.';
};

const JWTLogin = ({ className, ...rest }) => {
  const { login } = useAuth();
  const scriptedRef = useScriptRef();

  return (
    <Formik
      initialValues={{
        cpf: '',
        password: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        cpf: Yup.string().required('Insira um CPF.'),
        password: Yup.string().max(255).required('Insira uma senha.')
      })}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        try {
          await login(values.cpf, values.password);
          if (scriptedRef.current) {
            setStatus({ success: true });
            setSubmitting(true);
          }
        } catch (err) {
          console.error('err:', err);
          if (scriptedRef.current) {
            setStatus({ success: false });
            setErrors({ submit: loginErrorMessage(err) });
            setSubmitting(false);
          }
        }
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit} className={className} {...rest}>
          <div className="form-group mb-3">
            <input
              className="form-control"
              error={touched.cpf && errors.cpf}
              label="CPF"
              name="cpf"
              placeholder="CPF"
              onBlur={handleBlur}
              onChange={handleChange}
              type="cpf"
              value={values.cpf}
            />
            {touched.cpf && errors.cpf && <small className="text-danger form-text">{errors.cpf}</small>}
          </div>
          <div className="form-group mb-4">
            <input
              className="form-control"
              error={touched.password && errors.password}
              label="Senha"
              name="password"
              placeholder="Senha"
              onBlur={handleBlur}
              onChange={handleChange}
              type="password"
              value={values.password}
            />
            {touched.password && errors.password && <small className="text-danger form-text">{errors.password}</small>}
          </div>

          {errors.submit && (
            <Col sm={12}>
              <Alert>{errors.submit}</Alert>
            </Col>
          )}

          <Row>
            <Col mt={2}>
              <Button className="btn-block mb-4" color="primary" disabled={isSubmitting} size="large" type="submit" variant="primary">
                LOGIN
              </Button>
            </Col>
          </Row>
        </form>
      )}
    </Formik>
  );
};

export default JWTLogin;
