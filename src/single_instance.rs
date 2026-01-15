use single_instance::SingleInstance as SingleInstanceLib;

pub struct SingleInstance {
    instance: SingleInstanceLib,
}

impl SingleInstance {
    pub fn new(name: &str) -> std::io::Result<Self> {
        let instance = SingleInstanceLib::new(name)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
        Ok(Self { instance })
    }

    pub fn is_single(&self) -> bool {
        self.instance.is_single()
    }
}
