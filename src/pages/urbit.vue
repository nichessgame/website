<template>
  <v-container class="mt-6" max-width="900">
    <h2> Urbit guide </h2>
    <p class="mt-2"> Don't worry if this seems too difficult. Soon we'll have real servers that are
      simple to use and Urbit will only be used by the developers.</p>
    <p class="mt-2">
      <b>NOTE:</b> There is no matchmaking system. If you want to play against someone, you'll need
      to know their username.
    </p>
    <h3 class="mt-6"> 1. Get an Urbit ship</h3>
    <p class="mt-2">
      Unfortunately this is not as simple as it should be. Here's the official <a class="custom-link"
        href="https://docs.urbit.org/get-on-urbit">Get on Urbit</a> guide. You have a few options.
    </p>
    <h4 class="mt-2">1.1 Mine a comet</h4>
    <p class="mt-2">
      If you're using a desktop or a laptop, your best choice is to mine a comet for free (steps 3
      and 4 in the previous link). If you're on Windows, you'll need to use WSL. The whole process
      should look something like:
    </p>
    <p class="ml-2 mt-2 code">
      curl -L https://urbit.org/install/linux-x86_64/latest | tar xzk --transform='s/.*/urbit/g'
    </p>
    <p class="ml-2 mt-2 code">
      ./urbit -c mycomet
    </p>
    <p class="ml-2 mt-2 code">
      ./mycomet/.run
    </p>
    <p class="ml-2 mt-2 code">
      +code
    </p>
    <p class="mt-2">
      Open http://localhost:8080 in your web browser and paste the password that you got from the
      +code command. When you're done using your comet, press Ctrl + D to shut it down.
    </p>
    <h4 class="mt-2">1.2 Get a free ship from Tlon</h4>
    <p class="mt-2">
      Unlike mining a comet, this will work on any platform. If you go to <a class="custom-link"
        href="https://docs.urbit.org/get-on-urbit">Get on Urbit</a>, you should see an invite link
      under "Get on Urbit faster" section. Click the link and follow the instructions. It might take
      a day or two for your account to get activated. When that happens, go to <a class="custom-link"
        href="https://tlon.network/">https://tlon.network/</a> and log in there.
    </p>
    <p class="mt-2">
      After logging in, open landscape by going to <a class="custom-link"
        href="https://sampel-palnet.tlon.network/apps/landscape">https://sampel-palnet.tlon.network/apps/landscape</a>
      (replace sampel-palnet with your ship's ID).
    </p>
    <p class="mt-2">
      Keep in mind that this probably won't work forever. As Nichess grows, it's unlikely that Tlon
      will want to give us so many free accounts.
    </p>
    <h4 class="mt-2">1.3 Host your own ship</h4>
    <p class="mt-2">
      You probably don't want to do this as it's the most complicated option and will also cost you
      some money if you decide to use the cloud. If you still want to do it, follow <a class="custom-link"
        href="https://docs.urbit.org/user-manual/running">these instructions</a>.
    </p>
    <h3 class="mt-6"> 2. Install Nichess</h3>
    <p class="mt-2"> Once you're logged in, open the terminal app and run:</p>
    <p class="ml-2 mt-2 code">
      |install ~riclur-macned %nichess
    </p>
    <h3 class="mt-6"> 3. Find a game</h3>
    <p class="mt-2">
      Once you open the app, go to the Games page in the navigation bar and then click on Challenges.
      After you either accept a challenge or someone accepts your challenge, you'll need to select the
      game in the "Active Games" section before you can play.
    </p>

  </v-container>
</template>

<script setup>
  //
</script>

<style scoped>
.custom-link {
  color: #6393ea;
  text-decoration: underline;
}
.custom-link:hover {
  cursor:pointer;
}

.code {
  font-family: "Courier New", Courier, monospace;
  font-size: 0.9em;
  line-height: 1.5;
}

</style>
