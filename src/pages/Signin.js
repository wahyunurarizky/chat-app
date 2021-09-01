import React from 'react';
import firebase from 'firebase/app';
import { Alert, Button, Col, Container, Grid, Icon, Panel, Row } from 'rsuite';
import { auth, database } from '../misc/firebase';

const Signin = () => {
  const signInWithProvider = async provider => {
    try {
      const { additionalUserInfo, user } = await auth.signInWithPopup(provider);

      if (additionalUserInfo.isNewUser) {
        await database.ref(`/profiles/${user.uid}`).set({
          name: user.displayName,
          createdAt: firebase.database.ServerValue.TIMESTAMP,
        });
      }

      Alert.success('SignIn', 4000);
    } catch (err) {
      Alert.error(err.message, 4000);
    }
  };

  const onFacebookSignIn = () => {
    signInWithProvider(new firebase.auth.FacebookAuthProvider());
  };
  const onGoogleSignIn = () => {
    signInWithProvider(new firebase.auth.GoogleAuthProvider());
  };

  return (
    <Container>
      <Grid className="mt-page">
        <Row>
          <Col xs={24} md={12} mdOffset={6}>
            <Panel>
              <div className="text-center">
                <h2>Welcome to chat</h2>
                <p>
                  Create with ❤ by{' '}
                  <a href="https://arzky.me"> Wahyu Nur Arizky</a> with reactJS
                </p>
                {/* <p>
                  From Course Udemy by{' '}
                  <a href="http://udemy.com/course/the-complete-react-bootcamp-2020-w-react-hooks-firebase/">
                    Arash Ahadzadeh, Andrew Hulenko
                  </a>{' '}
                </p> */}
              </div>

              <div className="mt-3">
                <Button block color="blue" onClick={onFacebookSignIn}>
                  <Icon icon="facebook" /> Continue with facebook
                </Button>
                <Button block color="green" onClick={onGoogleSignIn}>
                  <Icon icon="google" /> Continue with google
                </Button>
              </div>
            </Panel>
          </Col>
        </Row>
      </Grid>
    </Container>
  );
};

export default Signin;
