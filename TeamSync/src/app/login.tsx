import { useState } from "react";
import { Text, TextInput, View, Pressable } from "react-native";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    function handleLogin() {
        if (email.trim() === "") {
            setError("E-mail adresinizi giriniz.");
            return;
        }
        if (password.trim() === "") {
            setError("Şifrenizi giriniz.");
            return;
        }
        setError("");
        console.log("Basariyla giris yapildi!");
      }
        
    

    return (
        <View>
            <Text>Login Screen</Text>
            <TextInput

                placeholder="Email"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Pressable onPress={handleLogin}>
                <Text>Giriş Yap</Text>
            </Pressable>
            {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
        </View>
        );

}
